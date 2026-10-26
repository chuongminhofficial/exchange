#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
============================================================================
EXCHANGE SAAS & SUE REAL-TIME SDK FOR PYTHON (V4.0 - Python 3.8+)
============================================================================
- Hỗ trợ đầy đủ 26 Public Endpoints tỷ giá thời gian thực (150+ Fiat, 310+ Crypto, Forex, Vàng/Dầu, Chỉ số).
- Hỗ trợ tự động chuyển đổi ngôn ngữ phản hồi JSON: 'en' (Mặc định) hoặc 'vi' (Tiếng Việt).
- Tự động chuẩn hóa mọi URL/Link (https://domain.com/ex, http://127.9.12.3:8080/...) về đúng
  định dạng Hostname chuẩn và gửi kèm Header `X-Client-Host` khi gọi từ Backend Python.
- Không phụ thuộc thư viện ngoài (dùng `urllib` chuẩn của Python, hoặc tự động dùng `requests.Session` nếu có).
============================================================================
"""

import json
import urllib.parse
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional, Union


class ExchangeAPIError(Exception):
    """Ngoại lệ trả về từ cổng Exchange SaaS API."""

    def __init__(
        self,
        message: str,
        status_code: int = 0,
        error_code: str = "API_ERROR",
        quota_status: str = "",
        raw_payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(f"[{status_code} {error_code}] {message}")
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.quota_status = quota_status
        self.raw_payload = raw_payload or {}


class ExchangeClient:
    """Client tích hợp chính thức cho Exchange SaaS & SUE Real-Time API."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.l.lc/exchange",
        lang: str = "en",
        client_host: str = "",
        timeout: int = 10,
    ) -> None:
        if not api_key or not str(api_key).strip():
            raise ValueError("ExchangeClient: api_key is required.")
        self.api_key = str(api_key).strip()
        self.base_url = str(base_url or "https://api.l.lc/exchange").strip().rstrip("/")
        self.lang = self.normalize_lang(lang)
        self.client_host = self.normalize_hostname(client_host)
        self.timeout = max(2, int(timeout))

    @staticmethod
    def normalize_hostname(raw: str) -> str:
        """
        Tự động chuẩn hóa mọi URL/Link (https://domain.com/ex, http://127.9.12.3:8080/...)
        về đúng định dạng Hostname chuẩn (domain.com, 127.9.12.3).
        """
        if not raw:
            return ""
        s = str(raw).strip().strip("\"'`").strip()
        if not s:
            return ""
        if s == "*":
            return "*"

        is_wildcard = False
        lower = s.lower()
        if lower.startswith("http://*") or lower.startswith("https://*"):
            s = s[lower.find("://") + 3 :]
        elif lower.startswith("//*"):
            s = s[2:]

        if s.startswith("*."):
            is_wildcard = True
            s = s[2:]

        if "://" in s:
            parsed = urllib.parse.urlparse(s)
            s = parsed.hostname or s.split("://", 1)[1]
        elif s.startswith("//"):
            parsed = urllib.parse.urlparse("http:" + s)
            s = parsed.hostname or s.lstrip("/")

        if "@" in s:
            s = s.rsplit("@", 1)[1]

        for sep in ("/", "?", "#"):
            if sep in s:
                s = s.split(sep, 1)[0]

        s = s.strip()
        if s.startswith("[") and "]" in s:
            s = s[1 : s.find("]")]
        elif s.count(":") == 1:
            s = s.split(":", 1)[0]

        s = s.lower().strip().rstrip(".")
        if not s:
            return ""
        return f"*.{s}" if is_wildcard else s

    @staticmethod
    def normalize_lang(lang: str) -> str:
        l = str(lang or "en").strip().lower()
        if l.startswith("vi") or l == "vn":
            return "vi"
        return "en"

    def set_language(self, lang: str) -> "ExchangeClient":
        """Đổi ngôn ngữ phản hồi JSON mặc định ('en' hoặc 'vi')."""
        self.lang = self.normalize_lang(lang)
        return self

    def set_client_host(self, host_or_url: str) -> "ExchangeClient":
        """Cập nhật Hostname định danh của ứng dụng/server."""
        self.client_host = self.normalize_hostname(host_or_url)
        return self

    def request(
        self,
        endpoint_path: str,
        params: Optional[Dict[str, Any]] = None,
        lang: Optional[str] = None,
    ) -> Any:
        req_lang = self.normalize_lang(lang) if lang else self.lang
        clean_params: Dict[str, str] = {}
        if params:
            for k, v in params.items():
                if v is not None and str(v).strip() != "":
                    if isinstance(v, (list, tuple, set)):
                        clean_params[k] = ",".join(str(x) for x in v)
                    else:
                        clean_params[k] = str(v)

        if "lang" not in clean_params:
            clean_params["lang"] = req_lang

        path = "/" + str(endpoint_path or "/api/v1/rates").lstrip("/")
        qs = urllib.parse.urlencode(clean_params)
        url = f"{self.base_url}{path}?{qs}" if qs else f"{self.base_url}{path}"

        headers = {
            "Accept": "application/json",
            "X-API-Key": self.api_key,
            "Accept-Language": req_lang,
            "X-Language": req_lang,
            "User-Agent": "ExchangeSaaS-Python-SDK/4.0",
        }
        if self.client_host:
            headers["X-Client-Host"] = self.client_host
            headers["Origin"] = f"https://{self.client_host.lstrip('*.')}"

        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                raw_body = resp.read().decode("utf-8", errors="replace")
                return json.loads(raw_body)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            quota_status = e.headers.get("X-Quota-Status", "") if e.headers else ""
            try:
                payload = json.loads(err_body)
            except Exception:
                payload = {"status": "error", "raw": err_body}
            raise ExchangeAPIError(
                message=payload.get("message", f"HTTP Error {e.code}"),
                status_code=e.code,
                error_code=payload.get("code", "HTTP_ERROR"),
                quota_status=quota_status,
                raw_payload=payload,
            ) from e
        except urllib.error.URLError as e:
            raise ExchangeAPIError(
                message=f"Network connection error: {e.reason}",
                status_code=0,
                error_code="NETWORK_ERROR",
            ) from e

    # =========================================================================
    # NHÓM 1: TỶ GIÁ IN-MEMORY PRE-RENDER
    # =========================================================================

    def get_rates(
        self,
        symbol: Optional[str] = None,
        category_type: Optional[str] = None,
        lang: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.request("/api/v1/rates", {"symbol": symbol, "type": category_type}, lang=lang)

    def get_symbol_rate(self, symbol: str, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/rates", {"symbol": symbol.upper().strip()}, lang=lang)

    def get_fiat_rates(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/rates/fiat", lang=lang)

    def get_crypto_rates(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/rates/crypto", lang=lang)

    def get_forex_rates(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/rates/forex", lang=lang)

    def get_commodity_rates(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/rates/commodities", lang=lang)

    def get_index_rates(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/rates/indices", lang=lang)

    # =========================================================================
    # NHÓM 2: DỮ LIỆU THỊ TRƯỜNG, TÌM KIẾM & NẾN OHLCV
    # =========================================================================

    def get_latest_batch(
        self, symbols: Union[str, List[str]], lang: Optional[str] = None
    ) -> Dict[str, Any]:
        return self.request("/api/v1/latest", {"symbols": symbols}, lang=lang)

    def get_active_symbols(self, lang: Optional[str] = None) -> Any:
        return self.request("/api/v1/active", lang=lang)

    def search_symbols(
        self,
        query: str = "",
        category_type: Optional[str] = None,
        limit: int = 50,
        lang: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.request(
            "/api/v1/symbols/search",
            {"q": query, "type": category_type, "limit": limit},
            lang=lang,
        )

    def get_market_gainers(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/market/gainers", lang=lang)

    def get_market_losers(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/market/losers", lang=lang)

    def get_market_most_active(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/market/most-active", lang=lang)

    def get_market_summary(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/market/summary", lang=lang)

    def get_ohlc(
        self,
        symbol: str = "XAUUSD",
        interval: str = "1h",
        limit: int = 100,
        lang: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.request(
            "/api/v1/ohlc",
            {"symbol": symbol, "interval": interval, "limit": limit},
            lang=lang,
        )

    def get_tick_history(
        self, symbol: str = "EURUSD", count: int = 50, lang: Optional[str] = None
    ) -> Dict[str, Any]:
        return self.request(
            "/api/v1/tick-history", {"symbol": symbol, "count": count}, lang=lang
        )

    # =========================================================================
    # NHÓM 3: LỊCH KINH TẾ VĨ MÔ & TIN TỨC TÀI CHÍNH
    # =========================================================================

    def get_economic_calendar(
        self,
        countries: str = "US,EU,GB,JP",
        importance: str = "high",
        lang: Optional[str] = None,
    ) -> Any:
        return self.request(
            "/api/v1/calendar",
            {"countries": countries, "importance": importance},
            lang=lang,
        )

    def get_upcoming_calendar(
        self, importance: str = "high", limit: int = 20, lang: Optional[str] = None
    ) -> Any:
        return self.request(
            "/api/v1/calendar/upcoming",
            {"importance": importance, "limit": limit},
            lang=lang,
        )

    def get_calendar_countries(self, lang: Optional[str] = None) -> Any:
        return self.request("/api/v1/calendar/countries", lang=lang)

    def get_market_news(
        self, symbol: str = "XAUUSD", max_results: int = 10, lang: Optional[str] = None
    ) -> Any:
        return self.request(
            "/api/v1/news/market",
            {"symbol": symbol, "maxResults": max_results},
            lang=lang,
        )

    def get_tech_news(
        self, query: str = "bitcoin", max_results: int = 10, lang: Optional[str] = None
    ) -> Any:
        return self.request(
            "/api/v1/news/hn", {"q": query, "maxResults": max_results}, lang=lang
        )

    # =========================================================================
    # NHÓM 4: CÔNG CỤ TÙY BIẾN SAAS (QUY ĐỔI, MA TRẬN, DANH MỤC, WIDGET)
    # =========================================================================

    def convert(
        self,
        from_symbol: str = "USD",
        to_symbol: str = "VND",
        amount: float = 1.0,
        lang: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.request(
            "/api/v1/convert",
            {"from": from_symbol, "to": to_symbol, "amount": amount},
            lang=lang,
        )

    def get_cross_matrix(
        self,
        base: str = "USD",
        targets: Union[str, List[str]] = "VND,EUR,JPY,GBP,SGD,BTC,XAUUSD",
        amount: float = 100.0,
        lang: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.request(
            "/api/v1/saas/matrix",
            {"base": base, "targets": targets, "amount": amount},
            lang=lang,
        )

    def valuate_portfolio(
        self,
        holdings: Union[str, Dict[str, float]] = "BTC:1.5,ETH:10,XAUUSD:5",
        target_currency: str = "USD",
        lang: Optional[str] = None,
    ) -> Dict[str, Any]:
        if isinstance(holdings, dict):
            holdings = ",".join(f"{k}:{v}" for k, v in holdings.items())
        return self.request(
            "/api/v1/saas/portfolio",
            {"holdings": holdings, "target": target_currency},
            lang=lang,
        )

    def get_embed_ticker(
        self,
        symbols: Union[str, List[str]] = "EURUSD,USDVND,XAUUSD,BTC,ETH,SPX500",
        lang: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.request(
            "/api/v1/saas/embed-ticker", {"symbols": symbols}, lang=lang
        )

    def get_catalog(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/exchange/catalog", lang=lang)

    # =========================================================================
    # NHÓM 5: TÀI KHOẢN, HẠN NGẠCH QUOTA & ĐỐI SOÁT SUE
    # =========================================================================

    def get_account_status(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/api/v1/account/status", lang=lang)

    def check_health(self, lang: Optional[str] = None) -> Dict[str, Any]:
        return self.request("/health", lang=lang)
