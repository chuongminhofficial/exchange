# Comprehensive Integration Guide & Official SDK Reference — Exchange SaaS & SUE Real-Time API (V4.0)

Official technical documentation for developers and enterprises integrating the **Exchange SaaS & SUE Real-Time Engine** (`https://api.l.lc/exchange`). Version 4.0 introduces **Zero-Latency Bilingual JSON Localization (`en` default / `vi` Vietnamese)**, **Commercial-Grade Allow/Disable Host Firewall (supporting both Web CORS & Server-to-Server)**, and **Official Multi-Language SDKs (JavaScript/TypeScript, PHP, Python, Go)**.

## 1. Connection Architecture & Security Authentication

### 1.1. Base Endpoints
- **Public Gateway URL**: `https://api.l.lc/exchange`
- **Full Versioned Path**: `https://api.l.lc/exchange/api/v1/...`
- **Short Alias Paths**: `https://api.l.lc/exchange/rates`, `https://api.l.lc/exchange/convert`, `https://api.l.lc/exchange/health`

### 1.2. Passing Your API Key
All requests to the 26 authenticated Public Endpoints require an `API Key` passed via one of the following 3 methods (in priority order):
1. **Standard HTTP Header (Recommended)**: `X-API-Key: sk_live_xxxxxx`
2. **Authorization Bearer Header**: `Authorization: Bearer sk_live_xxxxxx`
3. **URL Query Parameter**: `?api_key=sk_live_xxxxxx`

## 2. Automatic Bilingual JSON Response Engine (`en` / `vi`)

The gateway supports real-time localization of JSON responses (including status/error `message`, asset `name`, and `supported_categories`) with **0ms latency** using dual pre-rendered `[]byte` buffers in RAM:

- **Default Language (when omitted)**: English (`en`).
- **Supported Languages**: English (`en`) and Vietnamese (`vi`).

### How to Activate Language in Requests (Priority Order):
1. **Query Parameter**: Append `?lang=vi` or `?lang=en` (or `?locale=vi`).
2. **Custom Header**: `X-Language: vi` or `X-Language: en`.
3. **Standard HTTP Header**: `Accept-Language: vi-VN,vi;q=0.9` or `Accept-Language: en-US,en;q=0.9`.

### Sample JSON Response by Language (`GET /api/v1/convert?from=XAUUSD&to=VND&amount=1`)

**Default (`?lang=en` or omitted):**
```json
{
  "status": "success",
  "lang": "en",
  "message": "Real-time currency conversion calculated successfully.",
  "from": "XAUUSD",
  "from_name": "Spot Gold vs US Dollar (XAU/USD)",
  "to": "VND",
  "to_name": "Vietnamese Dong (VND)",
  "amount": 1,
  "result": 69875520,
  "from_usd_val": 2745.6,
  "to_usd_val": 0.00003929,
  "timestamp": 1761415200
}
```

**Vietnamese (`?lang=vi` or Header `Accept-Language: vi`):**
```json
{
  "status": "success",
  "lang": "vi",
  "message": "Quy đổi tiền tệ thời gian thực thành công.",
  "from": "XAUUSD",
  "from_name": "Vàng Giao Ngay (Spot Gold / USD)",
  "to": "VND",
  "to_name": "Đồng Việt Nam (Vietnamese Dong)",
  "amount": 1,
  "result": 69875520,
  "from_usd_val": 2745.6,
  "to_usd_val": 0.00003929,
  "timestamp": 1761415200
}
```

## 3. Commercial Domain Firewall Rules (`Allow Host` & `Disable Host`)

### 3.1. Automatic URL/Link Normalization to Canonical Hostname
Across the Customer Portal, API Gateway, and all official SDKs, any URL or IP address configured by the user is automatically normalized to a clean hostname or IP:
- `https://domain.com` $ightarrow$ `domain.com`
- `http://domain.com/ex?test=1` $ightarrow$ `domain.com`
- `http://127.9.12.3:8080/api` $ightarrow$ `127.9.12.3`
- `https://*.partner.vn/app` $ightarrow$ `*.partner.vn`

### 3.2. Anti-Conflict & Evaluation Priority Rules
1. **Strict Anti-Conflict**: A domain or IP present in `Allow Host` cannot be added to `Disable Host` (and vice versa).
2. **`Disable Host` Evaluated First (Blacklist)**: If any request identifier (`Origin`, `Referer`, `X-Client-Host`, or `Client IP`) matches `Disable Host`, the gateway immediately returns `HTTP 403 Forbidden` (`code: "HOST_DISABLED"`).
3. **`Allow Host` Evaluation (Whitelist)**:
   - When `Allow Host` is **empty (`""`) or `*`**: All domains and IPs are allowed (except those in `Disable Host`).
   - When `Allow Host` **contains domains/IPs**: Only requests matching `Allow Host` are permitted. Supports exact match (`domain.com` automatically matches `www.domain.com`), IP match (`127.9.12.3`), and Wildcard subdomains (`*.domain.com`).

### 3.3. Best Practices for Backend Server-to-Server Calls (When `Allow Host` is Active)
- **From Web Browsers (Frontend JS)**: Browsers automatically send `Origin` and `Referer` headers containing your website domain, which the gateway verifies automatically.
- **From Backend Servers (PHP, Node.js, Python, Go, cURL)**: Because server-side HTTP calls do not automatically attach a browser `Origin`, use one of two commercial best practices:
  - **Method 1 (Recommended for Production)**: Add your **Backend Server Public IP** (e.g., `127.9.12.3`) or domain to `Allow Host`. If using a domain, initialize the SDK with `clientHost: 'domain.com'` (the SDK automatically sends `X-Client-Host: domain.com` and `Origin: https://domain.com`).
  - **Method 2**: Create a dedicated **Sub API Key** for your Backend with `Allow Host Override` set to your server IP, and a separate **Sub API Key** for your Frontend with `Allow Host Override` set to `*.domain.com`.

## 4. Official SDK Usage Guide (4 Languages)

### 4.1. JavaScript / TypeScript SDK (`sdk/js/exchange_sdk.js`)

Supports **Node.js (v18+)**, **Next.js / Nuxt.js**, **React / Vue**, **Bun**, **Deno**, and **Browser**.

```javascript
const { ExchangeClient, ExchangeAPIError } = require('./exchange_sdk.js');

const client = new ExchangeClient({
  apiKey: 'sk_live_your_api_key',
  baseUrl: 'https://api.l.lc/exchange',
  lang: 'en', // Default 'en', switch to 'vi' for Vietnamese responses
  clientHost: 'https://domain.com/ex', // Auto-normalized to 'domain.com'
  timeoutMs: 8000
});

async function runDemo() {
  try {
    // Fetch Spot Gold (XAUUSD) in English (default)
    const goldEN = await client.getSymbolRate('XAUUSD');
    console.log('Gold (EN):', goldEN.data.name, goldEN.data.price_usd);

    // Switch to Vietnamese for a single request or globally
    const convVI = await client.convert('USD', 'VND', 100, { lang: 'vi' });
    console.log('Convert (VI):', convVI.message, convVI.result);

    // Multi-currency cross rate matrix for E-commerce checkout
    const matrix = await client.getCrossMatrix('USD', ['VND', 'EUR', 'JPY', 'BTC', 'XAUUSD'], 50);
    console.log('Matrix:', matrix.matrix);

    // Real-time multi-asset portfolio valuation
    const portfolio = await client.valuatePortfolio({ BTC: 1.5, ETH: 10, XAUUSD: 5 }, 'USD');
    console.log('Total Portfolio Value (USD):', portfolio.total_value_usd);

    // Check real-time Quota & SUE Billing status
    const status = await client.getAccountStatus();
    console.log('Monthly Quota Used:', status.realtime_quota_usage.month_used);
  } catch (err) {
    if (err instanceof ExchangeAPIError) {
      console.error(`API Error [${err.statusCode} - ${err.errorCode}]: ${err.message}`);
    } else {
      console.error('Network Error:', err);
    }
  }
}

runDemo();
```

### 4.2. PHP SDK (`sdk/php/ExchangeSDK.php`)

Compatible with **PHP 7.4 / 8.0 / 8.1 / 8.2 / 8.3** (Laravel, Symfony, WordPress, or vanilla PHP) with built-in **Persistent cURL Keep-Alive**.

```php
<?php
require_once __DIR__ . '/ExchangeSDK.php';

use ExchangeSaaS\ExchangeClient;
use ExchangeSaaS\ExchangeAPIException;

try {
    $client = new ExchangeClient('sk_live_your_api_key', [
        'base_url'    => 'https://api.l.lc/exchange',
        'lang'        => 'en',                    // Default 'en', or 'vi'
        'client_host' => 'https://domain.com/ex', // Auto-normalized to 'domain.com'
        'timeout'     => 10,
    ]);

    // 1. Batch real-time quotes
    $latest = $client->getLatestBatch(['EURUSD', 'XAUUSD', 'BTC', 'VND']);
    print_r($latest['data']);

    // 2. Currency conversion with Vietnamese localized response
    $convertVI = $client->convert('BTC', 'VND', 0.5, 'vi');
    echo $convertVI['message'] . " Result: " . number_format($convertVI['result']) . " VND\n";

    // 3. Historical OHLCV candlesticks (1h interval, 100 bars)
    $ohlc = $client->getOHLC('XAUUSD', '1h', 100);
    echo "XAUUSD bars count: " . count($ohlc['bars'] ?? []) . "\n";

} catch (ExchangeAPIException $e) {
    echo "API Error (HTTP {$e->statusCode} - {$e->errorCode}): {$e->getMessage()}\n";
}
```

### 4.3. Python SDK (`sdk/python/exchange_sdk.py`)

Compatible with **Python 3.8+**, 100% standalone using Python's standard library (zero external dependencies required), suitable for Django, FastAPI, Flask, AI Agents, and Quant Trading Bots.

```python
from exchange_sdk import ExchangeClient, ExchangeAPIError

client = ExchangeClient(
    api_key="sk_live_your_api_key",
    base_url="https://api.l.lc/exchange",
    lang="en",
    client_host="https://domain.com/ex",
)

try:
    gold = client.get_symbol_rate("XAUUSD")
    print("Gold EN:", gold["data"]["name"], gold["data"]["price_usd"])

    conv = client.convert("USD", "VND", amount=100, lang="vi")
    print(f"100 USD = {conv['result']:,.0f} VND ({conv['message']})")

    portfolio = client.valuate_portfolio({"BTC": 1.2, "ETH": 5, "XAUUSD": 3}, target_currency="USD")
    print("Total Portfolio USD:", portfolio["total_value_usd"])

except ExchangeAPIError as err:
    print(f"API Error [{err.status_code} {err.error_code}]: {err.message}")
```

### 4.4. Go SDK (`sdk/go/exchange_sdk.go`)

Designed for high-performance **Go (Golang)** microservices and trading engines.

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	exchangesdk "github.com/exchange-saas/exchange-sdk/sdk/go"
)

func main() {
	client, err := exchangesdk.NewClient(exchangesdk.Config{
		APIKey:     "sk_live_your_api_key",
		BaseURL:    "https://api.l.lc/exchange",
		Lang:       exchangesdk.LangEN,
		ClientHost: "https://domain.com/ex",
		Timeout:    8 * time.Second,
	})
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()

	resEN, err := client.Convert(ctx, "USD", "VND", 100)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("EN Message:", resEN["message"], "Result:", resEN["result"])

	client.SetLanguage(exchangesdk.LangVI)
	resVI, err := client.Convert(ctx, "XAUUSD", "VND", 1)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("VI Message:", resVI["message"], "Name:", resVI["from_name"])
}
```


## 5. Complete Reference of 26 Public Endpoints & Query Parameters

All 26 Public Endpoints below support `?lang=en` (default) or `?lang=vi` (Vietnamese):

| # | Group | Method & Full Path | Short Alias | Sample Query Parameters | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | **RAM Rates** | `GET /api/v1/rates` | `GET /rates` | `?symbol=XAUUSD&lang=en` | Fetch all 500+ assets or filter by symbol/category from `[]byte` RAM cache |
| 02 | **RAM Rates** | `GET /api/v1/rates/fiat` | `GET /rates/fiat` | `?lang=en` | List 150+ ISO-4217 Fiat currencies (`VND`, `USD`, `EUR`, `JPY`...) |
| 03 | **RAM Rates** | `GET /api/v1/rates/crypto` | `GET /rates/crypto` | `?lang=en` | List 310+ Cryptocurrencies (`BTC`, `ETH`, `SOL`, `BNB`, `USDT`...) |
| 04 | **RAM Rates** | `GET /api/v1/rates/forex` | `GET /rates/forex` | `?lang=en` | Major & Cross Forex pairs (`EURUSD`, `GBPUSD`, `USDJPY`, `USDVND`...) |
| 05 | **RAM Rates** | `GET /api/v1/rates/commodities` | `GET /rates/commodities` | `?lang=en` | Precious metals & energy (`XAUUSD`, `XAGUSD`, `WTIUSD`, `BRENTUSD`...) |
| 06 | **RAM Rates** | `GET /api/v1/rates/indices` | `GET /rates/indices` | `?lang=en` | Global stock indices (`SPX500`, `NAS100`, `US30`, `DXY`, `VNINDEX`...) |
| 07 | **Market Data** | `GET /api/v1/latest` | `GET /latest` | `?symbols=EURUSD,XAUUSD,BTC&lang=en` | Batch real-time Bid/Ask/Mid quotes for multiple symbols |
| 08 | **Market Data** | `GET /api/v1/active` | `GET /active` | `?lang=en` | List all symbols currently receiving live streaming ticks |
| 09 | **Market Data** | `GET /api/v1/symbols/search` | `GET /symbols/search` | `?q=Gold&limit=30&lang=en` | Search symbols by English/Vietnamese name or ticker and filter by category |
| 10 | **Market Data** | `GET /api/v1/market/gainers` | `GET /market/gainers` | `?lang=en` | Top 20 24h percentage gainers |
| 11 | **Market Data** | `GET /api/v1/market/losers` | `GET /market/losers` | `?lang=en` | Top 20 24h percentage losers |
| 12 | **Market Data** | `GET /api/v1/market/most-active` | `GET /market/most-active` | `?lang=en` | Top 20 assets by 24h trading activity |
| 13 | **Market Data** | `GET /api/v1/market/summary` | `GET /market/summary` | `?lang=en` | Market breadth overview (advancing, declining, unchanged counts) |
| 14 | **OHLC & Ticks** | `GET /api/v1/ohlc` | `GET /ohlc` | `?symbol=XAUUSD&interval=1h&limit=100` | Historical OHLCV candlestick bars (`1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`) |
| 15 | **OHLC & Ticks** | `GET /api/v1/tick-history` | `GET /tick-history` | `?symbol=EURUSD&count=50` | Recent tick-by-tick price execution history for a symbol |
| 16 | **Calendar & News** | `GET /api/v1/calendar` | `GET /calendar` | `?countries=US,EU,JP&importance=high` | Macroeconomic calendar across 54 countries (CPI, Nonfarm, Fed/ECB rates) |
| 17 | **Calendar & News** | `GET /api/v1/calendar/upcoming` | `GET /calendar/upcoming` | `?importance=high&limit=20` | High-impact macroeconomic events releasing in the upcoming hours |
| 18 | **Calendar & News** | `GET /api/v1/calendar/countries` | `GET /calendar/countries` | `None` | Supported countries and currencies in the economic calendar |
| 19 | **Calendar & News** | `GET /api/v1/news/market` | `GET /news/market` | `?symbol=XAUUSD&maxResults=10` | Real-time Forex, Gold, Commodities, and Crypto market news |
| 20 | **Calendar & News** | `GET /api/v1/news/hn` | `GET /news/hn` | `?q=bitcoin&maxResults=10` | Technology, Fintech, and Crypto news from Hacker News |
| 21 | **SaaS Utilities** | `GET /api/v1/convert` | `GET /convert` | `?from=BTC&to=VND&amount=1.5&lang=en` | Instant cross-conversion between any Fiat, Crypto, or Spot Gold (`XAUUSD`) |
| 22 | **SaaS Utilities** | `GET /api/v1/saas/matrix` | `GET /saas/matrix` | `?base=USD&targets=VND,EUR,BTC&amount=100` | Multi-currency cross rate matrix for international E-commerce |
| 23 | **SaaS Utilities** | `GET /api/v1/saas/portfolio` | `GET /saas/portfolio` | `?holdings=BTC:1.5,XAUUSD:5&target=USD` | Real-time multi-asset portfolio total valuation and weight breakdown |
| 24 | **SaaS Utilities** | `GET /api/v1/saas/embed-ticker` | `GET /saas/embed-ticker` | `?symbols=EURUSD,USDVND,XAUUSD,BTC&lang=en` | Ultra-compact JSON payload for website marquee tickers |
| 25 | **SaaS Utilities** | `GET /api/v1/exchange/catalog` | `GET /exchange/catalog` | `?lang=en` | Metadata summary of all supported asset categories in RAM |
| 26 | **Account & SUE** | `GET /api/v1/account/status` | `GET /account/status` | `?lang=en` | Real-time Minute/Hour/Day/Month quota counters, endpoint permissions & SUE billing |

## 6. Standardized Error Codes (`en` / `vi` Localized)

| HTTP Code | Error Code (`code`) | `X-Quota-Status` Header | Meaning & Resolution |
| :--- | :--- | :--- | :--- |
| `401` | `UNAUTHORIZED` | `-` | Missing `API Key`. Pass via `X-API-Key` header or `?api_key=`. |
| `403` | `FORBIDDEN` | `-` | `API Key` does not exist or account/key is suspended (`is_active = false`). |
| `403` | `HOST_DISABLED` | `HOST_DISABLED` | Your domain or IP is listed in the `Disable Host` blacklist. |
| `403` | `HOST_NOT_ALLOWED` | `HOST_NOT_ALLOWED` | `Allow Host` is enabled on your account, and the calling domain/IP is not whitelisted (for backend calls, pass `X-Client-Host` via the SDK or add your server IP to `Allow Host`). |
| `403` | `ENDPOINT_FORBIDDEN` | `ENDPOINT_DENIED_*` | Your current subscription plan does not include permission for this endpoint. |
| `403` | `DATA_CATEGORY_NOT_ALLOWED` | `-` | Your current plan does not cover this asset category (e.g., Free tier includes `fiat,crypto`). |
| `404` | `SYMBOL_NOT_FOUND` | `-` | The requested currency or asset symbol does not exist in memory. |
| `429` | `QUOTA_EXCEEDED` | `LIMIT_EXCEEDED_*` | Minute/Hour/Day/Month or Total quota limit exceeded. Upgrade to **SUE** for unlimited access. |
