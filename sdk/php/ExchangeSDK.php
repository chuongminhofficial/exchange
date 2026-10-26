<?php
/**
 * ============================================================================
 * EXCHANGE SAAS & SUE REAL-TIME SDK FOR PHP (V4.0 - PHP 7.4 / 8.x)
 * ============================================================================
 * - Hỗ trợ đầy đủ 26 Public Endpoints tỷ giá thời gian thực (150+ Fiat, 310+ Crypto, Forex, Vàng/Dầu, Chỉ số).
 * - Hỗ trợ tự động chuyển đổi ngôn ngữ phản hồi JSON: 'en' (Mặc định) hoặc 'vi' (Tiếng Việt).
 * - Tự động chuẩn hóa mọi URL/Link (https://domain.com/ex, http://127.9.12.3:8080/...) về đúng
 *   định dạng Hostname chuẩn và gửi kèm Header `X-Client-Host` khi gọi từ Backend PHP (Server-to-Server).
 * - Tái sử dụng kết nối Persistent cURL Keep-Alive giúp giảm 70% độ trễ bắt tay SSL/TLS.
 * ============================================================================
 */

namespace ExchangeSaaS;

use Exception;

class ExchangeAPIException extends Exception {
    public int $statusCode;
    public string $errorCode;
    public string $quotaStatus;
    public ?array $rawPayload;

    public function __construct(string $message, int $statusCode = 0, string $errorCode = 'API_ERROR', string $quotaStatus = '', ?array $rawPayload = null) {
        parent::__construct($message, $statusCode);
        $this->statusCode = $statusCode;
        $this->errorCode = $errorCode;
        $this->quotaStatus = $quotaStatus;
        $this->rawPayload = $rawPayload;
    }
}

class ExchangeClient {
    private string $apiKey;
    private string $baseUrl;
    private string $lang;
    private string $clientHost;
    private int $timeoutSec;
    private bool $verifySsl;
    /** @var resource|\CurlHandle|null */
    private $curlHandle = null;

    /**
     * Khởi tạo ExchangeClient SDK cho PHP
     *
     * @param string $apiKey Khóa API Key SaaS (VD: 'sk_live_...')
     * @param array $options Tuỳ chọn:
     *   - 'base_url' (string): Mặc định 'https://api.l.lc/exchange'
     *   - 'lang' (string): Ngôn ngữ phản hồi JSON ('en' mặc định, hỗ trợ 'vi')
     *   - 'client_host' (string): Tên miền hoặc IP của server/website (VD: 'domain.com' hoặc 'https://domain.com/ex')
     *   - 'timeout' (int): Thời gian chờ tối đa (giây), mặc định 10s
     *   - 'verify_ssl' (bool): Kiểm tra chứng chỉ SSL, mặc định true
     */
    public function __construct(string $apiKey, array $options = []) {
        $apiKey = trim($apiKey);
        if ($apiKey === '') {
            throw new ExchangeAPIException('ExchangeClient: API Key cannot be empty.', 400, 'MISSING_API_KEY');
        }
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim(trim($options['base_url'] ?? 'https://api.l.lc/exchange'), '/');
        $this->lang = self::normalizeLang($options['lang'] ?? 'en');

        // Nếu không truyền client_host, tự động phát hiện từ $_SERVER['HTTP_HOST'] hoặc $_SERVER['SERVER_NAME'] nếu chạy trên Web Server
        $rawHost = $options['client_host'] ?? ($_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? ''));
        $this->clientHost = self::normalizeHostname((string)$rawHost);

        $this->timeoutSec = max(2, (int)($options['timeout'] ?? 10));
        $this->verifySsl = isset($options['verify_ssl']) ? (bool)$options['verify_ssl'] : true;
    }

    /**
     * Tự động chuẩn hóa mọi URL/Link (https://domain.com/ex, http://127.9.12.3:8080/...) về đúng định dạng Hostname chuẩn
     */
    public static function normalizeHostname(string $raw): string {
        $s = trim($raw);
        $s = trim($s, " \t\n\r\0\x0B\"'`");
        if ($s === '') return '';
        if ($s === '*') return '*';

        $isWildcard = false;
        $lower = strtolower($s);
        if (strpos($lower, 'http://*') === 0 || strpos($lower, 'https://*') === 0) {
            $pos = strpos($lower, '://');
            $s = substr($s, $pos + 3);
        } elseif (strpos($lower, '//*') === 0) {
            $s = substr($s, 2);
        }

        if (strpos($s, '*.') === 0) {
            $isWildcard = true;
            $s = substr($s, 2);
        }

        if (strpos($s, '://') !== false) {
            $parsed = @parse_url($s);
            if (is_array($parsed) && !empty($parsed['host'])) {
                $s = $parsed['host'];
            } else {
                $parts = explode('://', $s, 2);
                $s = $parts[1];
            }
        } else if (strpos($s, '//') === 0) {
            $parsed = @parse_url('http:' . $s);
            if (is_array($parsed) && !empty($parsed['host'])) {
                $s = $parsed['host'];
            } else {
                $s = ltrim($s, '/');
            }
        }

        if (($atPos = strrpos($s, '@')) !== false) {
            $s = substr($s, $atPos + 1);
        }

        foreach (['/', '?', '#'] as $sep) {
            if (($pPos = strpos($s, $sep)) !== false) {
                $s = substr($s, 0, $pPos);
            }
        }

        $s = trim($s);
        if (strpos($s, '[') === 0) {
            if (($closePos = strpos($s, ']')) !== false) {
                $s = substr($s, 1, $closePos - 1);
            }
        } elseif (substr_count($s, ':') === 1) {
            $parts = explode(':', $s, 2);
            $s = $parts[0];
        }

        $s = rtrim(strtolower(trim($s)), '.');
        if ($s === '') return '';
        return $isWildcard ? ('*.' . $s) : $s;
    }

    public static function normalizeLang(string $lang): string {
        $l = strtolower(trim($lang));
        if (strpos($l, 'vi') === 0 || $l === 'vn') {
            return 'vi';
        }
        return 'en';
    }

    /**
     * Đổi ngôn ngữ phản hồi JSON mặc định ('en' hoặc 'vi')
     */
    public function setLanguage(string $lang): self {
        $this->lang = self::normalizeLang($lang);
        return $this;
    }

    /**
     * Đặt hoặc ghi đè Hostname định danh của ứng dụng (hỗ trợ truyền cả link https://domain.com/ex)
     */
    public function setClientHost(string $hostOrUrl): self {
        $this->clientHost = self::normalizeHostname($hostOrUrl);
        return $this;
    }

    /**
     * Thực hiện HTTP GET Request tới cổng Exchange API
     */
    public function request(string $endpointPath, array $params = [], ?string $overrideLang = null): array {
        $lang = $overrideLang !== null ? self::normalizeLang($overrideLang) : $this->lang;
        if (!isset($params['lang'])) {
            $params['lang'] = $lang;
        }

        $cleanParams = [];
        foreach ($params as $k => $v) {
            if ($v !== null && $v !== '') {
                $cleanParams[$k] = is_array($v) ? implode(',', $v) : (string)$v;
            }
        }

        $path = '/' . ltrim(trim($endpointPath), '/');
        $qs = http_build_query($cleanParams);
        $url = $this->baseUrl . $path . ($qs !== '' ? ('?' . $qs) : '');

        $headers = [
            'Accept: application/json',
            'X-API-Key: ' . $this->apiKey,
            'Accept-Language: ' . $lang,
            'X-Language: ' . $lang,
            'Connection: keep-alive',
            'User-Agent: ExchangeSaaS-PHP-SDK/4.0'
        ];

        if ($this->clientHost !== '') {
            $headers[] = 'X-Client-Host: ' . $this->clientHost;
            $headers[] = 'Origin: https://' . ltrim($this->clientHost, '*.');
        }

        $status = 0;
        $respBody = '';
        $quotaStatus = '';

        if (function_exists('curl_init')) {
            if ($this->curlHandle === null) {
                $this->curlHandle = curl_init();
            }
            $ch = $this->curlHandle;
            curl_reset($ch);
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeoutSec);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->verifySsl);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, $this->verifySsl ? 2 : 0);
            curl_setopt($ch, CURLOPT_ENCODING, '');
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $headerLine) use (&$quotaStatus) {
                $len = strlen($headerLine);
                if (stripos($headerLine, 'X-Quota-Status:') === 0) {
                    $quotaStatus = trim(substr($headerLine, 15));
                }
                return $len;
            });

            $raw = curl_exec($ch);
            $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            if ($raw === false) {
                throw new ExchangeAPIException('cURL request failed: ' . $err, 0, 'NETWORK_ERROR');
            }
            $respBody = (string)$raw;
        } else {
            $ctx = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => implode("\r\n", $headers),
                    'timeout' => $this->timeoutSec,
                    'ignore_errors' => true
                ],
                'ssl' => [
                    'verify_peer' => $this->verifySsl,
                    'verify_peer_name' => $this->verifySsl
                ]
            ]);
            $raw = @file_get_contents($url, false, $ctx);
            if (isset($http_response_header) && is_array($http_response_header)) {
                if (preg_match('#HTTP/\d+\.\d+\s+(\d+)#', $http_response_header[0], $m)) {
                    $status = (int)$m[1];
                }
                foreach ($http_response_header as $hl) {
                    if (stripos($hl, 'X-Quota-Status:') === 0) {
                        $quotaStatus = trim(substr($hl, 15));
                    }
                }
            }
            if ($raw === false) {
                throw new ExchangeAPIException('PHP stream request failed to ' . $url, 0, 'NETWORK_ERROR');
            }
            $respBody = (string)$raw;
        }

        $decoded = json_decode($respBody, true);
        if (!is_array($decoded)) {
            $decoded = ['status' => 'error', 'raw' => $respBody];
        }

        if ($status < 200 || $status >= 300) {
            throw new ExchangeAPIException(
                $decoded['message'] ?? ('HTTP Error ' . $status),
                $status,
                $decoded['code'] ?? 'HTTP_ERROR',
                $quotaStatus,
                $decoded
            );
        }

        return $decoded;
    }

    // =========================================================================
    // NHÓM 1: TỶ GIÁ IN-MEMORY PRE-RENDER
    // =========================================================================

    public function getRates(?string $symbol = null, ?string $type = null, ?string $lang = null): array {
        return $this->request('/api/v1/rates', ['symbol' => $symbol, 'type' => $type], $lang);
    }

    public function getSymbolRate(string $symbol, ?string $lang = null): array {
        return $this->request('/api/v1/rates', ['symbol' => strtoupper(trim($symbol))], $lang);
    }

    public function getFiatRates(?string $lang = null): array {
        return $this->request('/api/v1/rates/fiat', [], $lang);
    }

    public function getCryptoRates(?string $lang = null): array {
        return $this->request('/api/v1/rates/crypto', [], $lang);
    }

    public function getForexRates(?string $lang = null): array {
        return $this->request('/api/v1/rates/forex', [], $lang);
    }

    public function getCommodityRates(?string $lang = null): array {
        return $this->request('/api/v1/rates/commodities', [], $lang);
    }

    public function getIndexRates(?string $lang = null): array {
        return $this->request('/api/v1/rates/indices', [], $lang);
    }

    // =========================================================================
    // NHÓM 2: DỮ LIỆU THỊ TRƯỜNG, TÌM KIẾM & NẾN OHLCV
    // =========================================================================

    /** @param string|array $symbols */
    public function getLatestBatch($symbols, ?string $lang = null): array {
        return $this->request('/api/v1/latest', ['symbols' => $symbols], $lang);
    }

    public function getActiveSymbols(?string $lang = null): array {
        return $this->request('/api/v1/active', [], $lang);
    }

    public function searchSymbols(string $query = '', ?string $type = null, int $limit = 50, ?string $lang = null): array {
        return $this->request('/api/v1/symbols/search', ['q' => $query, 'type' => $type, 'limit' => $limit], $lang);
    }

    public function getMarketGainers(?string $lang = null): array {
        return $this->request('/api/v1/market/gainers', [], $lang);
    }

    public function getMarketLosers(?string $lang = null): array {
        return $this->request('/api/v1/market/losers', [], $lang);
    }

    public function getMarketMostActive(?string $lang = null): array {
        return $this->request('/api/v1/market/most-active', [], $lang);
    }

    public function getMarketSummary(?string $lang = null): array {
        return $this->request('/api/v1/market/summary', [], $lang);
    }

    public function getOHLC(string $symbol = 'XAUUSD', string $interval = '1h', int $limit = 100, ?string $lang = null): array {
        return $this->request('/api/v1/ohlc', ['symbol' => $symbol, 'interval' => $interval, 'limit' => $limit], $lang);
    }

    public function getTickHistory(string $symbol = 'EURUSD', int $count = 50, ?string $lang = null): array {
        return $this->request('/api/v1/tick-history', ['symbol' => $symbol, 'count' => $count], $lang);
    }

    // =========================================================================
    // NHÓM 3: LỊCH KINH TẾ VĨ MÔ & TIN TỨC TÀI CHÍNH
    // =========================================================================

    public function getEconomicCalendar(string $countries = 'US,EU,GB,JP', string $importance = 'high', ?string $lang = null): array {
        return $this->request('/api/v1/calendar', ['countries' => $countries, 'importance' => $importance], $lang);
    }

    public function getUpcomingCalendar(string $importance = 'high', int $limit = 20, ?string $lang = null): array {
        return $this->request('/api/v1/calendar/upcoming', ['importance' => $importance, 'limit' => $limit], $lang);
    }

    public function getCalendarCountries(?string $lang = null): array {
        return $this->request('/api/v1/calendar/countries', [], $lang);
    }

    public function getMarketNews(string $symbol = 'XAUUSD', int $maxResults = 10, ?string $lang = null): array {
        return $this->request('/api/v1/news/market', ['symbol' => $symbol, 'maxResults' => $maxResults], $lang);
    }

    public function getTechNews(string $query = 'bitcoin', int $maxResults = 10, ?string $lang = null): array {
        return $this->request('/api/v1/news/hn', ['q' => $query, 'maxResults' => $maxResults], $lang);
    }

    // =========================================================================
    // NHÓM 4: CÔNG CỤ TÙY BIẾN SAAS (QUY ĐỔI, MA TRẬN, DANH MỤC, WIDGET)
    // =========================================================================

    public function convert(string $from = 'USD', string $to = 'VND', float $amount = 1.0, ?string $lang = null): array {
        return $this->request('/api/v1/convert', ['from' => $from, 'to' => $to, 'amount' => $amount], $lang);
    }

    /** @param string|array $targets */
    public function getCrossMatrix(string $base = 'USD', $targets = 'VND,EUR,JPY,GBP,SGD,BTC,XAUUSD', float $amount = 100.0, ?string $lang = null): array {
        return $this->request('/api/v1/saas/matrix', ['base' => $base, 'targets' => $targets, 'amount' => $amount], $lang);
    }

    /**
     * @param string|array $holdings Chuỗi 'BTC:1.5,ETH:10' hoặc mảng ['BTC' => 1.5, 'ETH' => 10]
     */
    public function valuatePortfolio($holdings = 'BTC:1.5,ETH:10,XAUUSD:5', string $targetCurrency = 'USD', ?string $lang = null): array {
        if (is_array($holdings)) {
            $pairs = [];
            foreach ($holdings as $sym => $qty) {
                $pairs[] = $sym . ':' . $qty;
            }
            $holdings = implode(',', $pairs);
        }
        return $this->request('/api/v1/saas/portfolio', ['holdings' => $holdings, 'target' => $targetCurrency], $lang);
    }

    /** @param string|array $symbols */
    public function getEmbedTicker($symbols = 'EURUSD,USDVND,XAUUSD,BTC,ETH,SPX500', ?string $lang = null): array {
        return $this->request('/api/v1/saas/embed-ticker', ['symbols' => $symbols], $lang);
    }

    public function getCatalog(?string $lang = null): array {
        return $this->request('/api/v1/exchange/catalog', [], $lang);
    }

    // =========================================================================
    // NHÓM 5: TÀI KHOẢN, HẠN NGẠCH QUOTA & ĐỐI SOÁT SUE
    // =========================================================================

    public function getAccountStatus(?string $lang = null): array {
        return $this->request('/api/v1/account/status', [], $lang);
    }

    public function checkHealth(?string $lang = null): array {
        return $this->request('/health', [], $lang);
    }
}
