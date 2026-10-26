<div align="center">

# 🌐 Exchange SaaS & SUE Real-Time API — Official SDKs & Developer Suite (V4.0)

**Sub-Millisecond In-Memory Financial Market Data, Cross-Asset Currency Conversion & Enterprise SaaS Toolkit**

[![Version](https://img.shields.io/badge/API%20Version-v4.0.0-0A66C2?style=flat-square)](#)
[![Gateway](https://img.shields.io/badge/Gateway-https%3A%2F%2Fapi.l.lc%2Fexchange-10B981?style=flat-square)](https://api.l.lc/exchange/health)
[![Languages](https://img.shields.io/badge/SDKs-JS%2FTS%20%7C%20PHP%20%7C%20Python%20%7C%20Go-6366F1?style=flat-square)](#4-official-multi-language-sdks)
[![Response I18n](https://img.shields.io/badge/JSON%20I18n-English%20(en)%20%7C%20Vietnamese%20(vi)-F59E0B?style=flat-square)](#3-zero-latency-bilingual-json-engine-en--vi)
[![License: MIT](https://img.shields.io/badge/SDK%20License-MIT-22C55E?style=flat-square)](LICENSE)

**[🇬🇧 English Documentation](README.md)** · **[🇻🇳 Tài Liệu Tiếng Việt](README.vi.md)** · **[📘 Full API Reference (EN)](docs/en/INTEGRATION_GUIDE.md)** · **[📗 Tài Liệu Tích Hợp (VI)](docs/vi/INTEGRATION_GUIDE.md)** · **[🚀 Postman Collections](postman/)**

</div>

## Overview

Welcome to the official public SDK and developer integration repository for **Exchange SaaS & SUE Real-Time API (V4.0)**. Our core engine streams, normalizes, and pre-renders **500+ global financial instruments** directly in RAM (`[]byte` dual-language snapshots), delivering sub-millisecond responses with **0% per-request CPU serialization overhead**.

> **Security & Architecture Note**: This repository contains the **Official Public Client SDKs, Type Definitions, Code Examples, and Postman Collections** for integrating with `https://api.l.lc/exchange`. The underlying core matching/streaming engine and administrative infrastructure are proprietary and hosted as a managed cloud service.

### Key Highlights

* **500+ Real-Time Assets Across 5 Categories**:
  * **150+ ISO-4217 Fiat Currencies**: `USD`, `VND`, `EUR`, `JPY`, `GBP`, `SGD`, `AUD`, `CAD`, `CHF`, `KRW`, `THB`, `CNY`, and more.
  * **310+ Cryptocurrencies**: `BTC`, `ETH`, `SOL`, `BNB`, `USDT`, `XRP`, `ADA`, `DOGE`, and major DeFi/Layer-1 tokens.
  * **Major & Cross Forex Pairs**: `EURUSD`, `GBPUSD`, `USDJPY`, `USDVND`, `AUDUSD`, `EURJPY`, etc.
  * **Precious Metals & Commodities**: Spot Gold (`XAUUSD`), Spot Silver (`XAGUSD`), WTI Crude Oil (`WTIUSD`), Brent Oil (`BRENTUSD`), Natural Gas.
  * **Global Stock Indices**: `SPX500`, `NAS100`, `US30`, `DXY`, `VNINDEX`, `JP225`, `GER40`, `UK100`.
* **Zero-Latency Bilingual JSON (`en` / `vi`)**: Switch all status messages, error descriptions, asset names, and category labels between **English (`en`, default)** and **Vietnamese (`vi`)** on the fly via `?lang=vi`, `X-Language: vi`, or `Accept-Language: vi`.
* **Commercial-Grade Host Firewall (`Allow Host` & `Disable Host`)**: Protect your API keys across both **Browser Frontends (CORS)** and **Backend Microservices (Server-to-Server)** with automatic URL-to-hostname normalization, IP whitelisting, and wildcard subdomain matching (`*.domain.com`).
* **4 Official Zero-Boilerplate SDKs**: Ready-to-use client libraries for **JavaScript/TypeScript (Node.js, Bun, Deno, Browser)**, **PHP (7.4 / 8.x with Persistent cURL Keep-Alive)**, **Python (3.8+ Zero External Dependencies)**, and **Go (1.18+ High-Concurrency Microservices)**.

## 1. Repository Structure

```text
exchange-sdk/
├── docs/
│   ├── en/INTEGRATION_GUIDE.md                  # Full English Integration & API Reference
│   └── vi/INTEGRATION_GUIDE.md                  # Tài liệu tích hợp & Tham chiếu API Tiếng Việt
├── sdk/
│   ├── js/                                      # JavaScript / TypeScript SDK (exchange_sdk.js + .d.ts)
│   ├── php/                                     # PHP 7.4/8.x SDK (ExchangeSDK.php + composer.json)
│   ├── python/                                  # Python 3.8+ SDK (exchange_sdk.py + pyproject.toml)
│   └── go/                                      # Go 1.18+ SDK (exchange_sdk.go + go.mod)
├── examples/                                    # Runnable quickstart scripts for JS, PHP, Python, Go
├── postman/
│   ├── exchange_postman_collection.en.json      # Postman Collection v2.1.0 (English)
│   └── exchange_postman_collection.vi.json      # Postman Collection v2.1.0 (Tiếng Việt)
├── README.md                                    # English README (Default)
├── README.vi.md                                 # Vietnamese README (Tiếng Việt)
├── SECURITY.md                                  # Bilingual Security Policy
├── CONTRIBUTING.md                              # Bilingual Contribution Guidelines
├── CHANGELOG.md                                 # Release History (v1.0 -> v4.0)
└── LICENSE                                      # MIT License (Public Client SDKs)
```

## 2. Gateway Architecture & Authentication

### 2.1. Base URLs
* **Primary Public Gateway**: `https://api.l.lc/exchange`
* **Standard Versioned Path**: `https://api.l.lc/exchange/api/v1/...`
* **Short Alias Path**: `https://api.l.lc/exchange/rates`, `https://api.l.lc/exchange/convert`, `https://api.l.lc/exchange/health`

### 2.2. Authentication Methods
All 26 authenticated public endpoints accept your `API Key` via any of the following 3 methods (in order of priority):
1. **Standard HTTP Header (Recommended)**: `X-API-Key: sk_live_your_api_key`
2. **Bearer Token Header**: `Authorization: Bearer sk_live_your_api_key`
3. **URL Query Parameter**: `?api_key=sk_live_your_api_key`

*(Note: `GET /health` is a public health check endpoint and consumes 0 quota).*

## 3. Zero-Latency Bilingual JSON Engine (`en` / `vi`)

Every endpoint supports instant localization of JSON payloads (including `message`, `name`, `from_name`, `to_name`, and `supported_categories`) with **0ms overhead** thanks to dual pre-rendered RAM buffers:

* **Default Language**: English (`en`) when no language parameter is supplied.
* **Supported Languages**: `en` (English) and `vi` (Vietnamese).
* **How to Trigger (Priority Order)**:
  1. Query Parameter: `?lang=vi` or `?lang=en` (also accepts `?locale=vi`).
  2. Custom Header: `X-Language: vi` or `X-Language: en`.
  3. Standard HTTP Header: `Accept-Language: vi-VN,vi;q=0.9` or `Accept-Language: en-US,en;q=0.9`.

### Example Response (`GET /api/v1/convert?from=XAUUSD&to=VND&amount=1`)

```json
// Default English (?lang=en)
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

```json
// Vietnamese (?lang=vi)
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

## 4. Official Multi-Language SDKs

### 4.1. JavaScript / TypeScript (`sdk/js/exchange_sdk.js`)
Works seamlessly in **Node.js (v18+)**, **Next.js / Nuxt.js**, **Bun**, **Deno**, and **Browsers** (includes full TypeScript `.d.ts` definitions).

```javascript
const { ExchangeClient, ExchangeAPIError } = require('./sdk/js/exchange_sdk.js');

const client = new ExchangeClient({
  apiKey: process.env.EXCHANGE_API_KEY || 'sk_live_your_api_key',
  baseUrl: 'https://api.l.lc/exchange',
  lang: 'en',                         // 'en' (default) or 'vi'
  clientHost: 'https://domain.com/ex' // Auto-normalized to 'domain.com'
});

// 1. Get Spot Gold (XAUUSD) rate in English
const gold = await client.getSymbolRate('XAUUSD');
console.log(gold.data.name, gold.data.price_usd);

// 2. Convert 100 USD to VND with Vietnamese JSON response
const conv = await client.convert('USD', 'VND', 100, { lang: 'vi' });
console.log(conv.message, conv.result);
```

### 4.2. PHP (`sdk/php/ExchangeSDK.php`)
Compatible with **PHP 7.4 & 8.x** (Laravel, Symfony, WordPress, or vanilla PHP) featuring **Persistent cURL Keep-Alive** connection reuse (reduces SSL/TLS handshake latency by up to 70%).

```php
<?php
require_once __DIR__ . '/sdk/php/ExchangeSDK.php';

use ExchangeSaaS\ExchangeClient;

$client = new ExchangeClient(getenv('EXCHANGE_API_KEY') ?: 'sk_live_your_api_key', [
    'base_url'    => 'https://api.l.lc/exchange',
    'lang'        => 'en',
    'client_host' => 'https://domain.com/ex', // Auto-normalized to 'domain.com'
]);

$latest = $client->getLatestBatch(['EURUSD', 'XAUUSD', 'BTC', 'VND']);
$convertVI = $client->convert('BTC', 'VND', 0.5, 'vi');
```

### 4.3. Python (`sdk/python/exchange_sdk.py`)
Compatible with **Python 3.8+** using 100% standard library (`urllib`), requiring zero external `pip` packages—ideal for FastAPI, Django, Flask, AI Agents, and Quantitative Trading Bots.

```python
from sdk.python.exchange_sdk import ExchangeClient

client = ExchangeClient(
    api_key="sk_live_your_api_key",
    base_url="https://api.l.lc/exchange",
    lang="en",
    client_host="https://domain.com/ex",
)

gold = client.get_symbol_rate("XAUUSD")
portfolio = client.valuate_portfolio({"BTC": 1.2, "ETH": 5, "XAUUSD": 3}, target_currency="USD")
```

### 4.4. Go (`sdk/go/exchange_sdk.go`)
Built for high-throughput **Go 1.18+** microservices and low-latency trading engines with full `context.Context` support across all 28 methods.

```go
package main

import (
	"context"
	"fmt"
	"time"

	exchangesdk "github.com/exchange-saas/exchange-sdk/sdk/go"
)

func main() {
	client, _ := exchangesdk.NewClient(exchangesdk.Config{
		APIKey:     "sk_live_your_api_key",
		BaseURL:    "https://api.l.lc/exchange",
		Lang:       exchangesdk.LangEN,
		ClientHost: "https://domain.com/ex",
		Timeout:    8 * time.Second,
	})

	res, _ := client.Convert(context.Background(), "USD", "VND", 100)
	fmt.Println(res["message"], res["result"])
}
```

## 5. Commercial Host Firewall (`Allow Host` & `Disable Host`)

To protect your API quota from unauthorized third-party scraping, the gateway enforces strict domain/IP firewall rules:

1. **Automatic URL Normalization**: Any URL or IP entered in your dashboard or passed to `clientHost` in the SDK is automatically normalized to a canonical hostname/IP:
   * `https://domain.com/ex?test=1` $ightarrow$ `domain.com` (automatically matches both `domain.com` and `www.domain.com`)
   * `http://127.9.12.3:8080/api` $ightarrow$ `127.9.12.3`
   * `https://*.partner.vn/app` $ightarrow$ `*.partner.vn`
2. **Evaluation Priority**:
   * **`Disable Host` (Blacklist Checked First)**: If `Origin`, `Referer`, `X-Client-Host`, or `Client IP` matches any entry in `Disable Host`, the gateway immediately rejects the call with `HTTP 403 Forbidden` (`code: "HOST_DISABLED"`).
   * **`Allow Host` (Whitelist)**: When left empty (`""`) or set to `*`, all non-blacklisted hosts are permitted. When populated, only requests matching your configured domains, wildcard subdomains (`*.domain.com`), or server IPs are permitted (`HTTP 403 HOST_NOT_ALLOWED` otherwise).
3. **Best Practice for Backend Server-to-Server Calls**:
   * Add your **Backend Server Public IP** to `Allow Host`, OR pass `clientHost: 'domain.com'` when initializing the SDK (the SDK automatically attaches `X-Client-Host: domain.com`).
   * For multi-tier apps, create separate **Sub API Keys** in your account: one restricted to your backend server IP and another restricted to `*.yourdomain.com` for browser usage.

## 6. Complete Public Endpoints Catalog (26 Endpoints + Health Check)

| # | Category | Endpoint Path | Short Alias | Sample Query Parameters | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | **RAM Rates** | `GET /api/v1/rates` | `GET /rates` | `?symbol=XAUUSD&lang=en` | Fetch all 500+ assets or filter by symbol/category from RAM |
| 02 | **RAM Rates** | `GET /api/v1/rates/fiat` | `GET /rates/fiat` | `?lang=en` | 150+ ISO-4217 Fiat currencies (`USD`, `VND`, `EUR`, `JPY`...) |
| 03 | **RAM Rates** | `GET /api/v1/rates/crypto` | `GET /rates/crypto` | `?lang=en` | 310+ Cryptocurrencies (`BTC`, `ETH`, `SOL`, `BNB`, `USDT`...) |
| 04 | **RAM Rates** | `GET /api/v1/rates/forex` | `GET /rates/forex` | `?lang=en` | Major & Cross Forex pairs (`EURUSD`, `GBPUSD`, `USDVND`...) |
| 05 | **RAM Rates** | `GET /api/v1/rates/commodities` | `GET /rates/commodities` | `?lang=en` | Precious metals & energy (`XAUUSD`, `XAGUSD`, `WTIUSD`...) |
| 06 | **RAM Rates** | `GET /api/v1/rates/indices` | `GET /rates/indices` | `?lang=en` | Global stock indices (`SPX500`, `NAS100`, `US30`, `DXY`...) |
| 07 | **Market Data** | `GET /api/v1/latest` | `GET /latest` | `?symbols=EURUSD,XAUUSD,BTC` | Batch real-time Bid/Ask/Mid quotes for multiple symbols |
| 08 | **Market Data** | `GET /api/v1/active` | `GET /active` | `?lang=en` | List all symbols currently streaming live ticks |
| 09 | **Market Data** | `GET /api/v1/symbols/search` | `GET /symbols/search` | `?q=Gold&limit=30&lang=en` | Search symbols by English/Vietnamese name or ticker |
| 10 | **Market Data** | `GET /api/v1/market/gainers` | `GET /market/gainers` | `?lang=en` | Top 20 24h percentage gainers |
| 11 | **Market Data** | `GET /api/v1/market/losers` | `GET /market/losers` | `?lang=en` | Top 20 24h percentage losers |
| 12 | **Market Data** | `GET /api/v1/market/most-active` | `GET /market/most-active` | `?lang=en` | Top 20 most actively traded assets in 24h |
| 13 | **Market Data** | `GET /api/v1/market/summary` | `GET /market/summary` | `?lang=en` | Overall market breadth (advancers, decliners, unchanged) |
| 14 | **OHLC & Ticks** | `GET /api/v1/ohlc` | `GET /ohlc` | `?symbol=XAUUSD&interval=1h&limit=100` | Historical OHLCV candlestick bars (`1m` to `1d`) |
| 15 | **OHLC & Ticks** | `GET /api/v1/tick-history` | `GET /tick-history` | `?symbol=EURUSD&count=50` | Recent tick-by-tick price execution history |
| 16 | **Calendar & News** | `GET /api/v1/calendar` | `GET /calendar` | `?countries=US,EU,JP&importance=high` | Global macroeconomic calendar across 54 countries |
| 17 | **Calendar & News** | `GET /api/v1/calendar/upcoming` | `GET /calendar/upcoming` | `?importance=high&limit=20` | High-impact macroeconomic events releasing soon |
| 18 | **Calendar & News** | `GET /api/v1/calendar/countries` | `GET /calendar/countries` | `None` | Supported countries & currencies in the economic calendar |
| 19 | **Calendar & News** | `GET /api/v1/news/market` | `GET /news/market` | `?symbol=XAUUSD&maxResults=10` | Real-time international financial, gold, and forex news |
| 20 | **Calendar & News** | `GET /api/v1/news/hn` | `GET /news/hn` | `?q=bitcoin&maxResults=10` | Fintech, Crypto & Technology news feed |
| 21 | **SaaS Utilities** | `GET /api/v1/convert` | `GET /convert` | `?from=BTC&to=VND&amount=1.5` | Instant cross-conversion between any Fiat, Crypto, or Gold |
| 22 | **SaaS Utilities** | `GET /api/v1/saas/matrix` | `GET /saas/matrix` | `?base=USD&targets=VND,EUR,BTC&amount=100` | Multi-currency cross rate matrix for global E-commerce |
| 23 | **SaaS Utilities** | `GET /api/v1/saas/portfolio` | `GET /saas/portfolio` | `?holdings=BTC:1.5,XAUUSD:5&target=USD` | Real-time multi-asset portfolio valuation & allocation weights |
| 24 | **SaaS Utilities** | `GET /api/v1/saas/embed-ticker` | `GET /saas/embed-ticker` | `?symbols=EURUSD,USDVND,XAUUSD,BTC` | Ultra-compact JSON payload for website marquee tickers |
| 25 | **SaaS Utilities** | `GET /api/v1/exchange/catalog` | `GET /exchange/catalog` | `?lang=en` | Metadata catalog of all supported asset categories |
| 26 | **Account & SUE** | `GET /api/v1/account/status` | `GET /account/status` | `?lang=en` | Real-time Minute/Hour/Day/Month quota & SUE billing status (Alias: `/api/v1/billing/reconcile`) |
| 27 | **System Health** | `GET /health` | `GET /exchange/health` | `?lang=en` | Public gateway health check (0 quota cost) |

## 7. Standardized Error Codes

| HTTP Status | Error Code (`code`) | `X-Quota-Status` Header | Cause & Resolution |
| :--- | :--- | :--- | :--- |
| `401` | `UNAUTHORIZED` | `-` | Missing `API Key`. Pass via `X-API-Key` header, `Bearer` token, or `?api_key=`. |
| `403` | `FORBIDDEN` | `-` | Invalid `API Key` or key/account is currently suspended (`is_active = false`). |
| `403` | `HOST_DISABLED` | `HOST_DISABLED` | Your domain or IP is listed in `Disable Host` (Blacklist). |
| `403` | `HOST_NOT_ALLOWED` | `HOST_NOT_ALLOWED` | `Allow Host` whitelist is active and your domain/IP is not listed. Pass `clientHost` in the SDK or add your server IP to `Allow Host`. |
| `403` | `ENDPOINT_FORBIDDEN` | `ENDPOINT_DENIED_*` | Your current subscription plan does not include access to this endpoint. |
| `403` | `DATA_CATEGORY_NOT_ALLOWED` | `-` | Your subscription tier does not include this asset category (e.g., Free plan covers `fiat,crypto`). |
| `404` | `SYMBOL_NOT_FOUND` | `-` | The requested ticker symbol does not exist in the in-memory store. |
| `429` | `QUOTA_EXCEEDED` | `LIMIT_EXCEEDED_*` | Minute/Hour/Day/Month or Total quota limit reached. Upgrade to **SUE Enterprise** for unlimited elastic throughput. |

## License

The official client SDKs, documentation, and code examples in this repository are released under the [MIT License](LICENSE).
