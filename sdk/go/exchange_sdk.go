// ============================================================================
// EXCHANGE SAAS & SUE REAL-TIME SDK FOR GO (V4.0 - Go 1.18+)
// ============================================================================
// Package exchangesdk provides the official Go client library for integrating
// the Exchange SaaS & SUE Real-Time API (https://api.l.lc/exchange).
//
// Package exchangesdk cung cấp bộ thư viện tích hợp chính thức cho khách hàng
// gọi cổng tỷ giá thời gian thực https://api.l.lc/exchange.
// - Full support for all 26+ Public Endpoints / Hỗ trợ đầy đủ 26+ Public Endpoints.
// - Instant bilingual JSON response switching: "en" (Default) or "vi" (Vietnamese).
// - Automatic URL/Link normalization to canonical hostname and `X-Client-Host` header
//   injection for Server-to-Server Allow-Host verification.
// ============================================================================

package exchangesdk

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	DefaultBaseURL = "https://api.l.lc/exchange"
	LangEN         = "en"
	LangVI         = "vi"
)

// APIError represents a structured error response returned by the Exchange SaaS API.
// APIError biểu diễn lỗi có cấu trúc trả về từ cổng Exchange SaaS API.
type APIError struct {
	StatusCode  int                    `json:"status_code"`
	ErrorCode   string                 `json:"code"`
	Message     string                 `json:"message"`
	Lang        string                 `json:"lang"`
	QuotaStatus string                 `json:"quota_status"`
	RawPayload  map[string]interface{} `json:"raw_payload,omitempty"`
}

func (e *APIError) Error() string {
	return fmt.Sprintf("exchange api error (HTTP %d, code=%s, quota=%s): %s", e.StatusCode, e.ErrorCode, e.QuotaStatus, e.Message)
}

// Config defines initialization options for the Exchange SaaS Go Client.
// Config chứa các tham số cấu hình khởi tạo Client.
type Config struct {
	APIKey     string
	BaseURL    string
	Lang       string        // "en" (default / mặc định) or "vi" (Tiếng Việt)
	ClientHost string        // Application domain or server IP (e.g. "domain.com" or "https://domain.com/ex")
	Timeout    time.Duration // HTTP request timeout (default 10s)
	HTTPClient *http.Client
}

// Client is a thread-safe HTTP client for the Exchange SaaS & SUE Real-Time API.
type Client struct {
	apiKey     string
	baseURL    string
	lang       string
	clientHost string
	httpClient *http.Client
}

// NormalizeHostname automatically extracts and normalizes any URL/Link
// (e.g., "https://domain.com/ex", "http://127.9.12.3:8080/api") into a canonical
// hostname or IP ("domain.com", "127.9.12.3", "*.partner.vn").
func NormalizeHostname(raw string) string {
	s := strings.TrimSpace(raw)
	s = strings.Trim(s, `"'`+"`")
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	if s == "*" {
		return "*"
	}

	isWildcard := false
	lower := strings.ToLower(s)
	if strings.HasPrefix(lower, "http://*") || strings.HasPrefix(lower, "https://*") {
		idx := strings.Index(lower, "://")
		s = s[idx+3:]
	} else if strings.HasPrefix(lower, "//*") {
		s = s[2:]
	}
	if strings.HasPrefix(s, "*.") {
		isWildcard = true
		s = s[2:]
	}

	if strings.Contains(s, "://") {
		if u, err := url.Parse(s); err == nil && u.Host != "" {
			s = u.Host
		} else {
			parts := strings.SplitN(s, "://", 2)
			s = parts[1]
		}
	} else if strings.HasPrefix(s, "//") {
		if u, err := url.Parse("http:" + s); err == nil && u.Host != "" {
			s = u.Host
		} else {
			s = strings.TrimPrefix(s, "//")
		}
	}

	if atIdx := strings.LastIndex(s, "@"); atIdx != -1 {
		s = s[atIdx+1:]
	}
	for _, sep := range []string{"/", "?", "#"} {
		if idx := strings.Index(s, sep); idx != -1 {
			s = s[:idx]
		}
	}
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "[") {
		if h, _, err := net.SplitHostPort(s); err == nil && h != "" {
			s = h
		} else {
			s = strings.Trim(s, "[]")
		}
	} else if strings.Count(s, ":") == 1 {
		parts := strings.SplitN(s, ":", 2)
		s = parts[0]
	}
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.TrimRight(s, ".")
	if s == "" {
		return ""
	}
	if isWildcard {
		return "*." + s
	}
	return s
}

// NormalizeLang normalizes the language code to "en" (default) or "vi".
func NormalizeLang(lang string) string {
	l := strings.ToLower(strings.TrimSpace(lang))
	if strings.HasPrefix(l, "vi") || l == "vn" {
		return LangVI
	}
	return LangEN
}

// NewClient initializes a new Exchange SaaS API Client.
func NewClient(cfg Config) (*Client, error) {
	key := strings.TrimSpace(cfg.APIKey)
	if key == "" {
		return nil, fmt.Errorf("exchangesdk: APIKey is required")
	}
	base := strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/")
	if base == "" {
		base = DefaultBaseURL
	}
	timeout := cfg.Timeout
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	hc := cfg.HTTPClient
	if hc == nil {
		hc = &http.Client{Timeout: timeout}
	}
	return &Client{
		apiKey:     key,
		baseURL:    base,
		lang:       NormalizeLang(cfg.Lang),
		clientHost: NormalizeHostname(cfg.ClientHost),
		httpClient: hc,
	}, nil
}

// SetLanguage updates the default JSON response language ("en" or "vi").
func (c *Client) SetLanguage(lang string) *Client {
	c.lang = NormalizeLang(lang)
	return c
}

// SetClientHost updates the client hostname/IP sent via X-Client-Host.
func (c *Client) SetClientHost(hostOrURL string) *Client {
	c.clientHost = NormalizeHostname(hostOrURL)
	return c
}

// DoRequest executes an authenticated GET request against the Exchange SaaS Gateway.
func (c *Client) DoRequest(ctx context.Context, endpointPath string, params url.Values, out interface{}) error {
	if params == nil {
		params = url.Values{}
	}
	reqLang := c.lang
	if params.Get("lang") != "" {
		reqLang = NormalizeLang(params.Get("lang"))
	} else {
		params.Set("lang", reqLang)
	}

	cleanPath := "/" + strings.TrimLeft(strings.TrimSpace(endpointPath), "/")
	fullURL := c.baseURL + cleanPath
	if qs := params.Encode(); qs != "" {
		fullURL += "?" + qs
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-API-Key", c.apiKey)
	req.Header.Set("Accept-Language", reqLang)
	req.Header.Set("X-Language", reqLang)
	req.Header.Set("User-Agent", "ExchangeSaaS-Go-SDK/4.0")

	if c.clientHost != "" {
		req.Header.Set("X-Client-Host", c.clientHost)
		req.Header.Set("Origin", "https://"+strings.TrimPrefix(c.clientHost, "*."))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var rawMap map[string]interface{}
		_ = json.Unmarshal(body, &rawMap)
		msg, _ := rawMap["message"].(string)
		code, _ := rawMap["code"].(string)
		langStr, _ := rawMap["lang"].(string)
		if msg == "" {
			msg = fmt.Sprintf("HTTP status %d", resp.StatusCode)
		}
		return &APIError{
			StatusCode:  resp.StatusCode,
			ErrorCode:   code,
			Message:     msg,
			Lang:        langStr,
			QuotaStatus: resp.Header.Get("X-Quota-Status"),
			RawPayload:  rawMap,
		}
	}

	if out != nil {
		return json.Unmarshal(body, out)
	}
	return nil
}

// ============================================================================
// GROUP 1: IN-MEMORY PRE-RENDER RATES / TỶ GIÁ IN-MEMORY PRE-RENDER
// ============================================================================

// GetRates fetches all 500+ rates or filters by symbol / category (/api/v1/rates).
func (c *Client) GetRates(ctx context.Context, symbol, categoryType string) (map[string]interface{}, error) {
	q := url.Values{}
	if symbol != "" {
		q.Set("symbol", strings.ToUpper(strings.TrimSpace(symbol)))
	}
	if categoryType != "" {
		q.Set("type", strings.ToLower(strings.TrimSpace(categoryType)))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/rates", q, &res)
	return res, err
}

// GetSymbolRate fetches real-time rate details for a single symbol (/api/v1/rates?symbol=...).
func (c *Client) GetSymbolRate(ctx context.Context, symbol string) (map[string]interface{}, error) {
	return c.GetRates(ctx, symbol, "")
}

// GetFiatRates fetches 150+ ISO-4217 Fiat currencies (/api/v1/rates/fiat).
func (c *Client) GetFiatRates(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/rates/fiat", nil, &res)
	return res, err
}

// GetCryptoRates fetches 310+ Cryptocurrencies (/api/v1/rates/crypto).
func (c *Client) GetCryptoRates(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/rates/crypto", nil, &res)
	return res, err
}

// GetForexRates fetches major and cross Forex pairs (/api/v1/rates/forex).
func (c *Client) GetForexRates(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/rates/forex", nil, &res)
	return res, err
}

// GetCommodityRates fetches Gold (XAUUSD), Silver, Oil & Commodities (/api/v1/rates/commodities).
func (c *Client) GetCommodityRates(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/rates/commodities", nil, &res)
	return res, err
}

// GetIndexRates fetches Global Stock Indices (/api/v1/rates/indices).
func (c *Client) GetIndexRates(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/rates/indices", nil, &res)
	return res, err
}

// ============================================================================
// GROUP 2: MARKET DATA, SEARCH & OHLCV / DỮ LIỆU THỊ TRƯỜNG & NẾN OHLCV
// ============================================================================

// GetLatestBatch fetches real-time Bid/Ask/Mid quotes for multiple symbols (/api/v1/latest).
func (c *Client) GetLatestBatch(ctx context.Context, symbols []string) (map[string]interface{}, error) {
	q := url.Values{}
	if len(symbols) > 0 {
		q.Set("symbols", strings.Join(symbols, ","))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/latest", q, &res)
	return res, err
}

// GetActiveSymbols fetches all currently streaming symbols (/api/v1/active).
func (c *Client) GetActiveSymbols(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/active", nil, &res)
	return res, err
}

// SearchSymbols searches assets by keyword and optional category (/api/v1/symbols/search).
func (c *Client) SearchSymbols(ctx context.Context, query, categoryType string, limit int) (map[string]interface{}, error) {
	q := url.Values{}
	if query != "" {
		q.Set("q", query)
	}
	if categoryType != "" {
		q.Set("type", categoryType)
	}
	if limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", limit))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/symbols/search", q, &res)
	return res, err
}

// GetMarketGainers fetches top 20 24h gainers (/api/v1/market/gainers).
func (c *Client) GetMarketGainers(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/market/gainers", nil, &res)
	return res, err
}

// GetMarketLosers fetches top 20 24h losers (/api/v1/market/losers).
func (c *Client) GetMarketLosers(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/market/losers", nil, &res)
	return res, err
}

// GetMarketMostActive fetches top 20 most actively traded assets (/api/v1/market/most-active).
func (c *Client) GetMarketMostActive(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/market/most-active", nil, &res)
	return res, err
}

// GetMarketSummary fetches overall market breadth summary (/api/v1/market/summary).
func (c *Client) GetMarketSummary(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/market/summary", nil, &res)
	return res, err
}

// GetOHLC fetches historical OHLCV candlestick bars (/api/v1/ohlc).
func (c *Client) GetOHLC(ctx context.Context, symbol, interval string, limit int) (map[string]interface{}, error) {
	q := url.Values{}
	if symbol != "" {
		q.Set("symbol", symbol)
	}
	if interval != "" {
		q.Set("interval", interval)
	}
	if limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", limit))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/ohlc", q, &res)
	return res, err
}

// GetTickHistory fetches recent tick-by-tick price changes (/api/v1/tick-history).
func (c *Client) GetTickHistory(ctx context.Context, symbol string, count int) (map[string]interface{}, error) {
	q := url.Values{}
	if symbol != "" {
		q.Set("symbol", symbol)
	}
	if count > 0 {
		q.Set("count", fmt.Sprintf("%d", count))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/tick-history", q, &res)
	return res, err
}

// ============================================================================
// GROUP 3: ECONOMIC CALENDAR & NEWS / LỊCH KINH TẾ VĨ MÔ & TIN TỨC
// ============================================================================

// GetEconomicCalendar fetches macroeconomic events across 54 countries (/api/v1/calendar).
func (c *Client) GetEconomicCalendar(ctx context.Context, countries, importance string) (map[string]interface{}, error) {
	q := url.Values{}
	if countries != "" {
		q.Set("countries", countries)
	}
	if importance != "" {
		q.Set("importance", importance)
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/calendar", q, &res)
	return res, err
}

// GetUpcomingCalendar fetches upcoming macroeconomic releases (/api/v1/calendar/upcoming).
func (c *Client) GetUpcomingCalendar(ctx context.Context, importance string, limit int) (map[string]interface{}, error) {
	q := url.Values{}
	if importance != "" {
		q.Set("importance", importance)
	}
	if limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", limit))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/calendar/upcoming", q, &res)
	return res, err
}

// GetCalendarCountries fetches supported countries and currencies in the calendar (/api/v1/calendar/countries).
func (c *Client) GetCalendarCountries(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/calendar/countries", nil, &res)
	return res, err
}

// GetMarketNews fetches international financial market news (/api/v1/news/market).
func (c *Client) GetMarketNews(ctx context.Context, symbol string, maxResults int) (map[string]interface{}, error) {
	q := url.Values{}
	if symbol != "" {
		q.Set("symbol", symbol)
	}
	if maxResults > 0 {
		q.Set("maxResults", fmt.Sprintf("%d", maxResults))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/news/market", q, &res)
	return res, err
}

// GetTechNews fetches Fintech, Crypto & Tech news from Hacker News (/api/v1/news/hn).
func (c *Client) GetTechNews(ctx context.Context, query string, maxResults int) (map[string]interface{}, error) {
	q := url.Values{}
	if query != "" {
		q.Set("q", query)
	}
	if maxResults > 0 {
		q.Set("maxResults", fmt.Sprintf("%d", maxResults))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/news/hn", q, &res)
	return res, err
}

// ============================================================================
// GROUP 4: SAAS UTILITIES / CÔNG CỤ TÙY BIẾN SAAS
// ============================================================================

// Convert performs real-time cross-asset conversion between Fiat, Crypto, and Commodities (/api/v1/convert).
func (c *Client) Convert(ctx context.Context, from, to string, amount float64) (map[string]interface{}, error) {
	q := url.Values{}
	q.Set("from", strings.ToUpper(strings.TrimSpace(from)))
	q.Set("to", strings.ToUpper(strings.TrimSpace(to)))
	q.Set("amount", fmt.Sprintf("%v", amount))
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/convert", q, &res)
	return res, err
}

// GetCrossMatrix fetches a multi-currency cross rate matrix (/api/v1/saas/matrix).
func (c *Client) GetCrossMatrix(ctx context.Context, base string, targets []string, amount float64) (map[string]interface{}, error) {
	q := url.Values{}
	q.Set("base", strings.ToUpper(strings.TrimSpace(base)))
	if len(targets) > 0 {
		q.Set("targets", strings.Join(targets, ","))
	}
	q.Set("amount", fmt.Sprintf("%v", amount))
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/saas/matrix", q, &res)
	return res, err
}

// ValuatePortfolio calculates real-time multi-asset portfolio valuation (/api/v1/saas/portfolio).
func (c *Client) ValuatePortfolio(ctx context.Context, holdings map[string]float64, targetCurrency string) (map[string]interface{}, error) {
	q := url.Values{}
	var pairs []string
	for sym, qty := range holdings {
		pairs = append(pairs, fmt.Sprintf("%s:%v", strings.ToUpper(strings.TrimSpace(sym)), qty))
	}
	q.Set("holdings", strings.Join(pairs, ","))
	if targetCurrency != "" {
		q.Set("target", strings.ToUpper(strings.TrimSpace(targetCurrency)))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/saas/portfolio", q, &res)
	return res, err
}

// GetEmbedTicker fetches ultra-compact JSON payload for website marquee tickers (/api/v1/saas/embed-ticker).
func (c *Client) GetEmbedTicker(ctx context.Context, symbols []string) (map[string]interface{}, error) {
	q := url.Values{}
	if len(symbols) > 0 {
		q.Set("symbols", strings.Join(symbols, ","))
	}
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/saas/embed-ticker", q, &res)
	return res, err
}

// GetCatalog fetches metadata of all asset categories in RAM (/api/v1/exchange/catalog).
func (c *Client) GetCatalog(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/exchange/catalog", nil, &res)
	return res, err
}

// ============================================================================
// GROUP 5: ACCOUNT QUOTA, SUE BILLING & HEALTH / TÀI KHOẢN & QUOTA
// ============================================================================

// GetAccountStatus checks real-time quota counters & SUE billing status (/api/v1/account/status).
func (c *Client) GetAccountStatus(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/api/v1/account/status", nil, &res)
	return res, err
}

// CheckHealth checks the public gateway health status (/health - zero quota cost).
func (c *Client) CheckHealth(ctx context.Context) (map[string]interface{}, error) {
	var res map[string]interface{}
	err := c.DoRequest(ctx, "/health", nil, &res)
	return res, err
}
