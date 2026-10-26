/**
 * TypeScript Definitions for Exchange SaaS & SUE Real-Time API SDK (V4.0)
 * Hỗ trợ gợi ý mã (IntelliSense) cho TypeScript & VS Code.
 */

export type SupportedLang = 'en' | 'vi';
export type AssetCategory = 'all' | 'fiat' | 'crypto' | 'forex' | 'commodities' | 'indices';
export type OHLCInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
export type CalendarImportance = 'low' | 'medium' | 'high' | 'all';

export interface ExchangeClientConfig {
  /** SaaS API Key (e.g. 'sk_live_...') */
  apiKey: string;
  /** Base Gateway URL (default: 'https://api.l.lc/exchange') */
  baseUrl?: string;
  /** Default response language: 'en' (default) or 'vi' */
  lang?: SupportedLang;
  /** Client domain or IP for Allow-Host verification (auto-normalized) */
  clientHost?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeoutMs?: number;
  /** Automatic retries on 502/503/504 transient errors (default: 2) */
  maxRetries?: number;
}

export interface RequestOptions {
  lang?: SupportedLang;
  clientHost?: string;
}

export declare class ExchangeAPIError extends Error {
  statusCode: number;
  errorCode: string;
  quotaStatus: string;
  rawPayload: Record<string, any> | null;
  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    quotaStatus?: string,
    rawPayload?: Record<string, any> | null
  );
}

export declare class ExchangeClient {
  apiKey: string;
  baseUrl: string;
  lang: SupportedLang;
  clientHost: string;
  timeoutMs: number;
  maxRetries: number;

  constructor(config: ExchangeClientConfig);
  static normalizeHostname(raw: string): string;
  normalizeLang(lang?: string): SupportedLang;
  setLanguage(lang: SupportedLang): this;
  setClientHost(hostOrUrl: string): this;
  request<T = Record<string, any>>(
    endpointPath: string,
    params?: Record<string, any>,
    options?: RequestOptions
  ): Promise<T>;

  // Group 1: In-Memory Pre-Render Rates
  getRates(params?: { symbol?: string; type?: AssetCategory; lang?: SupportedLang }, options?: RequestOptions): Promise<Record<string, any>>;
  getSymbolRate(symbol: string, options?: RequestOptions): Promise<Record<string, any>>;
  getFiatRates(options?: RequestOptions): Promise<Record<string, any>>;
  getCryptoRates(options?: RequestOptions): Promise<Record<string, any>>;
  getForexRates(options?: RequestOptions): Promise<Record<string, any>>;
  getCommodityRates(options?: RequestOptions): Promise<Record<string, any>>;
  getIndexRates(options?: RequestOptions): Promise<Record<string, any>>;

  // Group 2: Market Data, Search & OHLCV
  getLatestBatch(symbols: string | string[], options?: RequestOptions): Promise<Record<string, any>>;
  getActiveSymbols(options?: RequestOptions): Promise<Record<string, any>>;
  searchSymbols(query?: string, extra?: { type?: AssetCategory; limit?: number }, options?: RequestOptions): Promise<Record<string, any>>;
  getMarketGainers(options?: RequestOptions): Promise<Record<string, any>>;
  getMarketLosers(options?: RequestOptions): Promise<Record<string, any>>;
  getMarketMostActive(options?: RequestOptions): Promise<Record<string, any>>;
  getMarketSummary(options?: RequestOptions): Promise<Record<string, any>>;
  getOHLC(symbol?: string, interval?: OHLCInterval, limit?: number, options?: RequestOptions): Promise<Record<string, any>>;
  getTickHistory(symbol?: string, count?: number, options?: RequestOptions): Promise<Record<string, any>>;

  // Group 3: Economic Calendar & Financial News
  getEconomicCalendar(filters?: { countries?: string; importance?: CalendarImportance }, options?: RequestOptions): Promise<Record<string, any>>;
  getUpcomingCalendar(filters?: { importance?: CalendarImportance; limit?: number }, options?: RequestOptions): Promise<Record<string, any>>;
  getCalendarCountries(options?: RequestOptions): Promise<Record<string, any>>;
  getMarketNews(symbol?: string, maxResults?: number, options?: RequestOptions): Promise<Record<string, any>>;
  getTechNews(query?: string, maxResults?: number, options?: RequestOptions): Promise<Record<string, any>>;

  // Group 4: SaaS Value-Added Utilities
  convert(from?: string, to?: string, amount?: number, options?: RequestOptions): Promise<Record<string, any>>;
  getCrossMatrix(base?: string, targets?: string | string[], amount?: number, options?: RequestOptions): Promise<Record<string, any>>;
  valuatePortfolio(holdings?: Record<string, number> | string, targetCurrency?: string, options?: RequestOptions): Promise<Record<string, any>>;
  getEmbedTicker(symbols?: string | string[], options?: RequestOptions): Promise<Record<string, any>>;
  getCatalog(options?: RequestOptions): Promise<Record<string, any>>;

  // Group 5: Account Quota, SUE Billing & Health
  getAccountStatus(options?: RequestOptions): Promise<Record<string, any>>;
  checkHealth(options?: RequestOptions): Promise<Record<string, any>>;
}
