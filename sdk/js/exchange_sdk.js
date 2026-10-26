/**
 * ============================================================================
 * EXCHANGE SAAS & SUE REAL-TIME SDK FOR JAVASCRIPT / TYPESCRIPT (V4.0)
 * ============================================================================
 * Hỗ trợ cả Node.js (v18+), Bun, Deno và Trình duyệt (Browser Fetch API).
 * - Tích hợp đầy đủ 26 Public Endpoints tỷ giá thời gian thực (Fiat, Crypto, Forex, Vàng/Dầu, Chỉ số).
 * - Hỗ trợ tự động chuyển đổi ngôn ngữ phản hồi JSON: 'en' (Mặc định) hoặc 'vi' (Tiếng Việt).
 * - Tự động chuẩn hóa URL/Link sang Hostname chuẩn và gửi kèm Header `X-Client-Host`
 *   để xác thực mượt mà khi khách hàng bật giới hạn `Allow Host` trên Server-to-Server.
 * ============================================================================
 */

class ExchangeAPIError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} errorCode
   * @param {string} quotaStatus
   * @param {object} rawPayload
   */
  constructor(message, statusCode, errorCode = 'API_ERROR', quotaStatus = '', rawPayload = null) {
    super(message);
    this.name = 'ExchangeAPIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.quotaStatus = quotaStatus;
    this.rawPayload = rawPayload;
  }
}

class ExchangeClient {
  /**
   * Khởi tạo ExchangeClient SDK
   * @param {Object} config
   * @param {string} config.apiKey - Khóa API Key SaaS (VD: 'sk_live_...')
   * @param {string} [config.baseUrl='https://api.l.lc/exchange'] - Endpoint gốc của cổng API
   * @param {'en'|'vi'} [config.lang='en'] - Ngôn ngữ phản hồi JSON ('en' mặc định, hỗ trợ 'vi')
   * @param {string} [config.clientHost=''] - Tên miền hoặc IP của ứng dụng/server (VD: 'domain.com' hoặc 'https://domain.com/ex') phục vụ kiểm tra Allow Host
   * @param {number} [config.timeoutMs=10000] - Thời gian chờ tối đa mỗi request (ms)
   * @param { number } [config.maxRetries=2] - Số lần tự động thử lại nếu lỗi mạng tạm thời (502/503/504)
   */
  constructor(config = {}) {
    if (!config || !config.apiKey || typeof config.apiKey !== 'string') {
      throw new Error('ExchangeClient: Missing required "apiKey" in configuration.');
    }
    this.apiKey = config.apiKey.trim();
    this.baseUrl = (config.baseUrl || 'https://api.l.lc/exchange').trim().replace(/\/+$/, '');
    this.lang = this.normalizeLang(config.lang || 'en');
    this.clientHost = ExchangeClient.normalizeHostname(config.clientHost || '');
    this.timeoutMs = Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 10000;
    this.maxRetries = Number.isInteger(config.maxRetries) ? config.maxRetries : 2;
  }

  /**
   * Tự động chuẩn hóa mọi URL/Link (https://domain.com/ex, http://127.9.12.3:8080/...) về đúng định dạng Hostname chuẩn
   * @param {string} raw
   * @returns {string}
   */
  static normalizeHostname(raw) {
    if (!raw) return '';
    let s = String(raw).trim().replace(/^['"`]+|['"`]+$/g, '').trim();
    if (!s) return '';
    if (s === '*') return '*';

    let isWildcard = false;
    const lower = s.toLowerCase();
    if (lower.startsWith('http://*') || lower.startsWith('https://*')) {
      s = s.substring(s.indexOf('://') + 3);
    } else if (lower.startsWith('//*')) {
      s = s.substring(2);
    }
    if (s.startsWith('*.')) {
      isWildcard = true;
      s = s.substring(2);
    }

    if (s.includes('://')) {
      try {
        const u = new URL(s);
        if (u.hostname) s = u.hostname;
      } catch (_) {
        s = s.split('://')[1] || s;
      }
    } else if (s.startsWith('//')) {
      try {
        const u = new URL('http:' + s);
        if (u.hostname) s = u.hostname;
      } catch (_) {
        s = s.replace(/^\/+/, '');
      }
    }

    if (s.includes('@')) s = s.substring(s.lastIndexOf('@') + 1);
    for (const sep of ['/', '?', '#']) {
      const idx = s.indexOf(sep);
      if (idx !== -1) s = s.substring(0, idx);
    }
    s = s.trim();
    if (s.startsWith('[') && s.includes(']')) {
      s = s.substring(1, s.indexOf(']'));
    } else if ((s.match(/:/g) || []).length === 1) {
      s = s.split(':')[0];
    }
    s = s.toLowerCase().trim().replace(/\.+$/, '');
    if (!s) return '';
    return isWildcard ? `*.${s}` : s;
  }

  /**
   * Chuẩn hóa mã ngôn ngữ ('en' mặc định, hỗ trợ 'vi')
   * @param {string} lang
   * @returns {'en'|'vi'}
   */
  normalizeLang(lang) {
    const l = String(lang || 'en').trim().toLowerCase();
    if (l.startsWith('vi') || l === 'vn') return 'vi';
    return 'en';
  }

  /**
   * Đổi ngôn ngữ phản hồi JSON mặc định cho toàn bộ phiên làm việc ('en' hoặc 'vi')
   * @param {'en'|'vi'} lang
   */
  setLanguage(lang) {
    this.lang = this.normalizeLang(lang);
    return this;
  }

  /**
   * Đổi hoặc gán Hostname định danh của ứng dụng (hỗ trợ truyền cả link https://domain.com/ex)
   * @param {string} hostOrUrl
   */
  setClientHost(hostOrUrl) {
    this.clientHost = ExchangeClient.normalizeHostname(hostOrUrl);
    return this;
  }

  /**
   * Gửi HTTP GET Request tới cổng Exchange API
   * @param {string} endpointPath - Đường dẫn endpoint (VD: '/api/v1/rates')
   * @param {Object} [params={}] - Tham số query
   * @param {Object} [options={}] - Tuỳ chọn ghi đè cho từng request ({ lang, clientHost })
   */
  async request(endpointPath, params = {}, options = {}) {
    const reqLang = options.lang ? this.normalizeLang(options.lang) : this.lang;
    const reqHost = options.clientHost ? ExchangeClient.normalizeHostname(options.clientHost) : this.clientHost;

    const cleanPath = '/' + String(endpointPath || '/api/v1/rates').replace(/^\/+/, '');
    const queryObj = new URLSearchParams();

    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        if (Array.isArray(v)) {
          queryObj.set(k, v.join(','));
        } else {
          queryObj.set(k, String(v));
        }
      }
    });

    if (!queryObj.has('lang')) {
      queryObj.set('lang', reqLang);
    }

    const qs = queryObj.toString();
    const url = `${this.baseUrl}${cleanPath}${qs ? '?' + qs : ''}`;

    const headers = {
      'Accept': 'application/json',
      'X-API-Key': this.apiKey,
      'Accept-Language': reqLang,
      'X-Language': reqLang,
    };

    if (reqHost) {
      headers['X-Client-Host'] = reqHost;
    }

    let lastError = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller ? controller.signal : undefined,
        });
        if (timer) clearTimeout(timer);

        const quotaStatus = response.headers.get('X-Quota-Status') || '';
        const text = await response.text();
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = { status: 'error', raw: text };
        }

        if (!response.ok) {
          throw new ExchangeAPIError(
            data?.message || `HTTP Error ${response.status}`,
            response.status,
            data?.code || 'HTTP_ERROR',
            quotaStatus,
            data
          );
        }

        return data;
      } catch (err) {
        if (timer) clearTimeout(timer);
        lastError = err;
        if (err instanceof ExchangeAPIError && err.statusCode < 500) {
          throw err; // Không retry đối với lỗi 401/403/404/429
        }
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
        }
      }
    }
    throw lastError;
  }

  // ==========================================================================
  // NHÓM 1: TỶ GIÁ IN-MEMORY PRE-RENDER (0% CPU OVERHEAD)
  // ==========================================================================

  /**
   * 1. Lấy toàn bộ 500+ tỷ giá hoặc tra cứu 1 mã / 1 phân khúc cụ thể (/api/v1/rates)
   * @param {Object} [params]
   * @param {string} [params.symbol] - Mã tài sản (VD: 'XAUUSD', 'BTC', 'VND')
   * @param {'all'|'fiat'|'crypto'|'forex'|'commodities'|'indices'} [params.type] - Lọc theo phân khúc
   * @param {'en'|'vi'} [params.lang] - Ngôn ngữ JSON ('en' hoặc 'vi')
   */
  async getRates(params = {}, options = {}) {
    return this.request('/api/v1/rates', params, options);
  }

  /** 2. Lấy tỷ giá của 1 mã tài sản duy nhất (/api/v1/rates?symbol=...) */
  async getSymbolRate(symbol, options = {}) {
    return this.request('/api/v1/rates', { symbol: String(symbol).toUpperCase() }, options);
  }

  /** 3. Lấy danh sách 150+ Ngoại tệ Quốc tế ISO-4217 (/api/v1/rates/fiat) */
  async getFiatRates(options = {}) {
    return this.request('/api/v1/rates/fiat', {}, options);
  }

  /** 4. Lấy danh sách 310+ Tiền điện tử Crypto (/api/v1/rates/crypto) */
  async getCryptoRates(options = {}) {
    return this.request('/api/v1/rates/crypto', {}, options);
  }

  /** 5. Lấy danh sách Cặp Ngoại hối Chéo Forex (/api/v1/rates/forex) */
  async getForexRates(options = {}) {
    return this.request('/api/v1/rates/forex', {}, options);
  }

  /** 6. Lấy danh sách Vàng, Bạc & Hàng hóa (/api/v1/rates/commodities) */
  async getCommodityRates(options = {}) {
    return this.request('/api/v1/rates/commodities', {}, options);
  }

  /** 7. Lấy danh sách Chỉ số Chứng khoán Toàn cầu (/api/v1/rates/indices) */
  async getIndexRates(options = {}) {
    return this.request('/api/v1/rates/indices', {}, options);
  }

  // ==========================================================================
  // NHÓM 2: DỮ LIỆU THỊ TRƯỜNG, TÌM KIẾM & BIỂU ĐỒ NẾN (OHLCV)
  // ==========================================================================

  /**
   * 8. Lấy giá thời gian thực của nhiều mã cùng lúc (/api/v1/latest)
   * @param {string|string[]} symbols - VD: ['EURUSD', 'XAUUSD', 'BTC', 'VND'] hoặc 'EURUSD,XAUUSD'
   */
  async getLatestBatch(symbols, options = {}) {
    const symStr = Array.isArray(symbols) ? symbols.join(',') : String(symbols || '');
    return this.request('/api/v1/latest', { symbols: symStr }, options);
  }

  /** 9. Danh sách mã đang có luồng tick trực tuyến (/api/v1/active) */
  async getActiveSymbols(options = {}) {
    return this.request('/api/v1/active', {}, options);
  }

  /**
   * 10. Tìm kiếm & lọc mã tài sản theo từ khóa (/api/v1/symbols/search)
   * @param {string} query - Từ khóa tên hoặc mã (VD: 'USD', 'Vàng', 'Gold', 'BTC')
   * @param {Object} [extra] - { type: 'fiat'|'crypto'|..., limit: 30 }
   */
  async searchSymbols(query = '', extra = {}, options = {}) {
    return this.request('/api/v1/symbols/search', { q: query, ...extra }, options);
  }

  /** 11. Bảng xếp hạng Top 20 mã tăng giá mạnh nhất 24h (/api/v1/market/gainers) */
  async getMarketGainers(options = {}) {
    return this.request('/api/v1/market/gainers', {}, options);
  }

  /** 12. Bảng xếp hạng Top 20 mã giảm giá sâu nhất 24h (/api/v1/market/losers) */
  async getMarketLosers(options = {}) {
    return this.request('/api/v1/market/losers', {}, options);
  }

  /** 13. Bảng xếp hạng Top 20 mã có khối lượng giao dịch sôi động nhất (/api/v1/market/most-active) */
  async getMarketMostActive(options = {}) {
    return this.request('/api/v1/market/most-active', {}, options);
  }

  /** 14. Tổng quan độ rộng thị trường (/api/v1/market/summary) */
  async getMarketSummary(options = {}) {
    return this.request('/api/v1/market/summary', {}, options);
  }

  /**
   * 15. Dữ liệu Nến lịch sử OHLCV (/api/v1/ohlc)
   * @param {string} symbol - VD: 'XAUUSD', 'EURUSD', 'BTC'
   * @param {'1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d'} [interval='1h']
   * @param {number} [limit=100]
   */
  async getOHLC(symbol = 'XAUUSD', interval = '1h', limit = 100, options = {}) {
    return this.request('/api/v1/ohlc', { symbol, interval, limit }, options);
  }

  /**
   * 16. Lịch sử biến động từng bước giá Tick (/api/v1/tick-history)
   * @param {string} symbol - VD: 'EURUSD'
   * @param {number} [count=50]
   */
  async getTickHistory(symbol = 'EURUSD', count = 50, options = {}) {
    return this.request('/api/v1/tick-history', { symbol, count }, options);
  }

  // ==========================================================================
  // NHÓM 3: LỊCH KINH TẾ VĨ MÔ & TIN TỨC TÀI CHÍNH
  // ==========================================================================

  /**
   * 17. Lịch kinh tế vĩ mô 54 quốc gia (/api/v1/calendar)
   * @param {Object} [filters] - { countries: 'US,EU,GB,JP', importance: 'high' }
   */
  async getEconomicCalendar(filters = {}, options = {}) {
    return this.request('/api/v1/calendar', filters, options);
  }

  /** 18. Sự kiện kinh tế quan trọng sắp công bố (/api/v1/calendar/upcoming) */
  async getUpcomingCalendar(filters = { importance: 'high', limit: 20 }, options = {}) {
    return this.request('/api/v1/calendar/upcoming', filters, options);
  }

  /** 19. Danh sách quốc gia hỗ trợ trong lịch kinh tế (/api/v1/calendar/countries) */
  async getCalendarCountries(options = {}) {
    return this.request('/api/v1/calendar/countries', {}, options);
  }

  /** 20. Tin tức thị trường tài chính quốc tế (/api/v1/news/market) */
  async getMarketNews(symbol = 'XAUUSD', maxResults = 10, options = {}) {
    return this.request('/api/v1/news/market', { symbol, maxResults }, options);
  }

  /** 21. Tin tức công nghệ, Fintech & Crypto từ Hacker News (/api/v1/news/hn) */
  async getTechNews(query = 'bitcoin', maxResults = 10, options = {}) {
    return this.request('/api/v1/news/hn', { q: query, maxResults }, options);
  }

  // ==========================================================================
  // NHÓM 4: CÔNG CỤ TÙY BIẾN SAAS (QUY ĐỔI, MA TRẬN, DANH MỤC, WIDGET)
  // ==========================================================================

  /**
   * 22. Quy đổi tiền tệ chéo đa năng giữa Fiat, Crypto và Vàng (/api/v1/convert)
   * @param {string} from - Mã nguồn (VD: 'USD', 'BTC', 'XAUUSD')
   * @param {string} to - Mã đích (VD: 'VND', 'EUR', 'USD')
   * @param {number} [amount=1] - Số lượng cần quy đổi
   */
  async convert(from = 'USD', to = 'VND', amount = 1, options = {}) {
    return this.request('/api/v1/convert', { from, to, amount }, options);
  }

  /**
   * 23. Bảng ma trận tỷ giá đa tiền tệ (/api/v1/saas/matrix)
   * @param {string} [base='USD']
   * @param {string|string[]} [targets='VND,EUR,JPY,GBP,SGD,BTC,XAUUSD']
   * @param {number} [amount=100]
   */
  async getCrossMatrix(base = 'USD', targets = 'VND,EUR,JPY,GBP,SGD,BTC,XAUUSD', amount = 100, options = {}) {
    const tStr = Array.isArray(targets) ? targets.join(',') : targets;
    return this.request('/api/v1/saas/matrix', { base, targets: tStr, amount }, options);
  }

  /**
   * 24. Định giá danh mục đầu tư đa tài sản theo thời gian thực (/api/v1/saas/portfolio)
   * @param {Object|string} holdings - VD: { BTC: 1.5, ETH: 10, XAUUSD: 5 } hoặc 'BTC:1.5,ETH:10,XAUUSD:5'
   * @param {string} [targetCurrency='USD'] - Đồng tiền định giá mục tiêu (VD: 'USD', 'VND', 'EUR')
   */
  async valuatePortfolio(holdings = 'BTC:1.5,ETH:10,XAUUSD:5', targetCurrency = 'USD', options = {}) {
    let hStr = holdings;
    if (holdings && typeof holdings === 'object' && !Array.isArray(holdings)) {
      hStr = Object.entries(holdings)
        .map(([sym, qty]) => `${sym}:${qty}`)
        .join(',');
    }
    return this.request('/api/v1/saas/portfolio', { holdings: hStr, target: targetCurrency }, options);
  }

  /**
   * 25. Dữ liệu thanh chạy tỷ giá siêu gọn cho Website Widget (/api/v1/saas/embed-ticker)
   * @param {string|string[]} [symbols='EURUSD,USDVND,XAUUSD,BTC,ETH,SPX500']
   */
  async getEmbedTicker(symbols = 'EURUSD,USDVND,XAUUSD,BTC,ETH,SPX500', options = {}) {
    const sStr = Array.isArray(symbols) ? symbols.join(',') : symbols;
    return this.request('/api/v1/saas/embed-ticker', { symbols: sStr }, options);
  }

  /** 26. Siêu dữ liệu danh mục tài sản hỗ trợ trong RAM (/api/v1/exchange/catalog) */
  async getCatalog(options = {}) {
    return this.request('/api/v1/exchange/catalog', {}, options);
  }

  // ==========================================================================
  // NHÓM 5: TÀI KHOẢN, HẠN NGẠCH QUOTA & ĐỐI SOÁT SUE
  // ==========================================================================

  /** 27. Tra cứu bộ đếm Quota Phút/Giờ/Ngày/Tháng & công nợ SUE (/api/v1/account/status) */
  async getAccountStatus(options = {}) {
    return this.request('/api/v1/account/status', {}, options);
  }

  /** 28. Kiểm tra trạng thái hoạt động của cổng API (/health - Không tốn Quota) */
  async checkHealth(options = {}) {
    return this.request('/health', {}, options);
  }
}

// Hỗ trợ xuất module đa chuẩn (CommonJS, ES Module và Global Browser Window)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExchangeClient, ExchangeAPIError };
}
if (typeof window !== 'undefined') {
  window.ExchangeClient = ExchangeClient;
  window.ExchangeAPIError = ExchangeAPIError;
}
