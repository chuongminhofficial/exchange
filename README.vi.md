<div align="center">

# 🌐 Exchange SaaS & SUE Real-Time API — Bộ SDK & Tài Liệu Tích Hợp Chính Thức (V4.0)

**Hệ Thống Tỷ Giá Tài Chính Thời Gian Thực In-Memory Siêu Tốc, Quy Đổi Đa Tài Sản & Bộ Công Cụ SaaS Doanh Nghiệp**

[![Phiên bản](https://img.shields.io/badge/API%20Version-v4.0.0-0A66C2?style=flat-square)](#)
[![Gateway](https://img.shields.io/badge/Gateway-https%3A%2F%2Fapi.l.lc%2Fexchange-10B981?style=flat-square)](https://api.l.lc/exchange/health)
[![Ngôn ngữ SDK](https://img.shields.io/badge/SDKs-JS%2FTS%20%7C%20PHP%20%7C%20Python%20%7C%20Go-6366F1?style=flat-square)](#4-hướng-dẫn-sử-dụng-bộ-sdk-chính-thức-4-ngôn-ngữ)
[![Song ngữ JSON](https://img.shields.io/badge/JSON%20I18n-Tiếng%20Anh%20(en)%20%7C%20Tiếng%20Việt%20(vi)-F59E0B?style=flat-square)](#3-cơ-chế-chuyển-đổi-ngôn-ngữ-phản-hồi-json-tự-động-en--vi)
[![Giấy phép: MIT](https://img.shields.io/badge/SDK%20License-MIT-22C55E?style=flat-square)](LICENSE)

**[🇬🇧 English Documentation](README.md)** · **[🇻🇳 Tài Liệu Tiếng Việt](README.vi.md)** · **[📘 Full API Reference (EN)](docs/en/INTEGRATION_GUIDE.md)** · **[📗 Tài Liệu Tích Hợp (VI)](docs/vi/INTEGRATION_GUIDE.md)** · **[🚀 Bộ Sưu Tập Postman](postman/)**

</div>

## Giới Thiệu Tổng Quan

Chào mừng bạn đến với kho lưu trữ GitHub chính thức cung cấp **Bộ SDK Đa Ngôn Ngữ, Tài Liệu Kỹ Thuật và Postman Collection** của hệ thống **Exchange SaaS & SUE Real-Time API (V4.0)**. Hệ thống lõi xử lý luồng dữ liệu trực tuyến và biên dịch sẵn (Pre-render) hơn **500+ mã tài sản tài chính toàn cầu** trực tiếp trong bộ nhớ RAM (`[]byte` kép), mang lại tốc độ phản hồi ở mức **micro-giây** với **0% tải CPU tuần tự hóa JSON trên từng request**.

> **Lưu ý Kiến trúc & Bảo mật**: Kho lưu trữ này cung cấp **Bộ thư viện Client SDK chính thức, Định nghĩa kiểu TypeScript, Ví dụ tích hợp và Bộ sưu tập Postman** dành cho lập trình viên và đối tác kết nối tới cổng `https://api.l.lc/exchange`. Mã nguồn lõi máy chủ (Core Streaming & Pre-render Engine) là tài sản thương mại độc quyền được vận hành dưới dạng dịch vụ đám mây (Managed SaaS).

### Điểm Nổi Bật Của Phiên Bản V4.0

* **Hơn 500+ Mã Tài Sản Thời Gian Thực Thuộc 5 Phân Khúc**:
  * **150+ Ngoại tệ Quốc tế (Fiat ISO-4217)**: `VND`, `USD`, `EUR`, `JPY`, `GBP`, `SGD`, `AUD`, `CAD`, `CHF`, `KRW`, `THB`, `CNY`...
  * **310+ Tiền điện tử (Cryptocurrencies)**: `BTC`, `ETH`, `SOL`, `BNB`, `USDT`, `XRP`, `ADA`, `DOGE` và các đồng DeFi/Layer-1 hàng đầu.
  * **Cặp Ngoại hối Chính & Chéo (Forex Pairs)**: `EURUSD`, `GBPUSD`, `USDJPY`, `USDVND`, `AUDUSD`, `EURJPY`...
  * **Kim loại quý & Hàng hóa (Commodities)**: Vàng giao ngay (`XAUUSD`), Bạc giao ngay (`XAGUSD`), Dầu thô WTI (`WTIUSD`), Dầu Brent (`BRENTUSD`), Khí tự nhiên.
  * **Chỉ số Chứng khoán Toàn cầu (Global Indices)**: `SPX500`, `NAS100`, `US30`, `DXY`, `VNINDEX`, `JP225`, `GER40`, `UK100`.
* **Chuyển Đổi Ngôn Ngữ JSON Tự Động Độ Trễ 0ms (`en` / `vi`)**: Tự động bản địa hóa thông báo trạng thái, mô tả lỗi, tên tài sản và danh mục giữa **Tiếng Anh (`en`, mặc định)** và **Tiếng Việt (`vi`)** qua tham số `?lang=vi`, header `X-Language: vi` hoặc `Accept-Language: vi`.
* **Tường Lửa Tên Miền Chuẩn Thương Mại (`Allow Host` & `Disable Host`)**: Bảo vệ khóa API trên cả **Trình duyệt Web (CORS)** lẫn **Máy chủ Backend (Server-to-Server)** với cơ chế tự động chuẩn hóa URL về hostname, hỗ trợ khớp IP máy chủ và tên miền phụ Wildcard (`*.domain.com`).
* **Bộ SDK Chính Thức Cho 4 Ngôn Ngữ Lập Trình**: Hỗ trợ đầy đủ **JavaScript/TypeScript (Node.js, Bun, Deno, Browser)**, **PHP (7.4 / 8.x có Persistent cURL Keep-Alive)**, **Python (3.8+ không phụ thuộc thư viện ngoài)** và **Go (1.18+ tối ưu cho Microservices hiệu năng cao)**.

## 1. Cấu Trúc Thư Mục Kho Lưu Trữ

```text
exchange-sdk/
├── docs/
│   ├── en/INTEGRATION_GUIDE.md                  # Tài liệu tích hợp & Tham chiếu API chi tiết (Tiếng Anh)
│   └── vi/INTEGRATION_GUIDE.md                  # Tài liệu tích hợp & Tham chiếu API chi tiết (Tiếng Việt)
├── sdk/
│   ├── js/                                      # JavaScript / TypeScript SDK (exchange_sdk.js + .d.ts)
│   ├── php/                                     # PHP 7.4/8.x SDK (ExchangeSDK.php + composer.json)
│   ├── python/                                  # Python 3.8+ SDK (exchange_sdk.py + pyproject.toml)
│   └── go/                                      # Go 1.18+ SDK (exchange_sdk.go + go.mod)
├── examples/                                    # Code mẫu chạy ngay cho JS, PHP, Python, Go
├── postman/
│   ├── exchange_postman_collection.en.json      # Postman Collection v2.1.0 (Bản Tiếng Anh)
│   └── exchange_postman_collection.vi.json      # Postman Collection v2.1.0 (Bản Tiếng Việt)
├── README.md                                    # Tài liệu giới thiệu chính (Tiếng Anh - Mặc định GitHub)
├── README.vi.md                                 # Tài liệu giới thiệu chính (Tiếng Việt)
├── SECURITY.md                                  # Chính sách bảo mật song ngữ
├── CONTRIBUTING.md                              # Hướng dẫn đóng góp song ngữ
├── CHANGELOG.md                                 # Lịch sử phiên bản (v1.0 -> v4.0)
└── LICENSE                                      # Giấy phép MIT (Dành cho bộ Client SDK)
```

## 2. Kiến Trúc Kết Nối & Xác Thực Bảo Mật

### 2.1. Endpoint Gốc (Base URL)
* **Public Gateway URL**: `https://api.l.lc/exchange`
* **Đường dẫn đầy đủ chuẩn hóa**: `https://api.l.lc/exchange/api/v1/...`
* **Đường dẫn rút gọn (Short Alias)**: `https://api.l.lc/exchange/rates`, `https://api.l.lc/exchange/convert`, `https://api.l.lc/exchange/health`

### 2.2. Phương Thức Truyền API Key
Mọi request tới 26 Public Endpoints yêu cầu xác thực bằng `API Key` thông qua 1 trong 3 cách (ưu tiên từ trên xuống):
1. **HTTP Header chuẩn (Khuyên dùng)**: `X-API-Key: sk_live_your_api_key`
2. **Authorization Bearer Header**: `Authorization: Bearer sk_live_your_api_key`
3. **Query Parameter**: `?api_key=sk_live_your_api_key`

*(Lưu ý: Endpoint `GET /health` dùng để kiểm tra trạng thái hoạt động của cổng API và hoàn toàn không tính vào hạn ngạch Quota).*

## 3. Cơ Chế Chuyển Đổi Ngôn Ngữ Phản Hồi JSON Tự Động (`en` / `vi`)

Hệ thống hỗ trợ tự động chuyển đổi ngôn ngữ trong JSON phản hồi (bao gồm cả **thông báo trạng thái/lỗi `message`**, **tên tài sản `name`**, và **danh mục `supported_categories`**) với độ trễ **0ms** nhờ bộ đệm Pre-render `[]byte` kép trong RAM:

* **Ngôn ngữ mặc định (khi không truyền)**: Tiếng Anh (`en`).
* **Ngôn ngữ hỗ trợ**: Tiếng Anh (`en`) và Tiếng Việt (`vi`).
* **Cách kích hoạt ngôn ngữ trong Request (theo thứ tự ưu tiên)**:
  1. **Query Parameter**: Thêm `?lang=vi` hoặc `?lang=en` (hoặc `?locale=vi`).
  2. **Custom Header**: `X-Language: vi` hoặc `X-Language: en`.
  3. **Standard HTTP Header**: `Accept-Language: vi-VN,vi;q=0.9` hoặc `Accept-Language: en-US,en;q=0.9`.

## 4. Hướng Dẫn Sử Dụng Bộ SDK Chính Thức (4 Ngôn Ngữ)

### 4.1. JavaScript / TypeScript SDK (`sdk/js/exchange_sdk.js`)
Hỗ trợ **Node.js (v18+)**, **Next.js / Nuxt.js**, **React / Vue**, **Bun**, **Deno** và **Browser** (đi kèm file định nghĩa kiểu `exchange_sdk.d.ts`).

```javascript
const { ExchangeClient, ExchangeAPIError } = require('./sdk/js/exchange_sdk.js');

const client = new ExchangeClient({
  apiKey: process.env.EXCHANGE_API_KEY || 'sk_live_your_api_key',
  baseUrl: 'https://api.l.lc/exchange',
  lang: 'en',                         // Mặc định 'en', đổi sang 'vi' nếu muốn phản hồi Tiếng Việt
  clientHost: 'https://domain.com/ex' // Tự động chuẩn hóa thành 'domain.com'
});

// 1. Lấy tỷ giá Vàng giao ngay (XAUUSD) bằng tiếng Anh (mặc định)
const goldEN = await client.getSymbolRate('XAUUSD');
console.log('Gold (EN):', goldEN.data.name, goldEN.data.price_usd);

// 2. Quy đổi 100 USD sang VND với phản hồi Tiếng Việt
const convVI = await client.convert('USD', 'VND', 100, { lang: 'vi' });
console.log('Quy đổi (VI):', convVI.message, convVI.result);
```

### 4.2. PHP SDK (`sdk/php/ExchangeSDK.php`)
Tương thích **PHP 7.4 & 8.x** (Laravel, Symfony, WordPress hoặc PHP thuần), tích hợp sẵn **Persistent cURL Keep-Alive** giúp giảm tới 70% độ trễ bắt tay SSL/TLS.

```php
<?php
require_once __DIR__ . '/sdk/php/ExchangeSDK.php';

use ExchangeSaaS\ExchangeClient;

$client = new ExchangeClient(getenv('EXCHANGE_API_KEY') ?: 'sk_live_your_api_key', [
    'base_url'    => 'https://api.l.lc/exchange',
    'lang'        => 'vi',                    // Phản hồi Tiếng Việt
    'client_host' => 'https://domain.com/ex', // Tự động chuẩn hóa thành 'domain.com'
]);

$latest = $client->getLatestBatch(['EURUSD', 'XAUUSD', 'BTC', 'VND']);
$convertVI = $client->convert('BTC', 'VND', 0.5, 'vi');
```

### 4.3. Python SDK (`sdk/python/exchange_sdk.py`)
Tương thích **Python 3.8+**, hoạt động độc lập 100% với thư viện chuẩn (không cần cài thêm gói phụ thuộc ngoài), phù hợp cho Django, FastAPI, Flask, AI Agent và Quant Trading Bot.

```python
from sdk.python.exchange_sdk import ExchangeClient

client = ExchangeClient(
    api_key="sk_live_your_api_key",
    base_url="https://api.l.lc/exchange",
    lang="vi",
    client_host="https://domain.com/ex",
)

gold_vi = client.get_symbol_rate("XAUUSD", lang="vi")
portfolio = client.valuate_portfolio({"BTC": 1.2, "ETH": 5, "XAUUSD": 3}, target_currency="USD")
```

### 4.4. Go SDK (`sdk/go/exchange_sdk.go`)
Dành cho các hệ thống Microservices và Trading Engine hiệu năng cao viết bằng **Go 1.18+**, hỗ trợ đầy đủ 28 hàm gọi tương ứng với toàn bộ các nhóm API.

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
		Lang:       exchangesdk.LangVI,
		ClientHost: "https://domain.com/ex",
		Timeout:    8 * time.Second,
	})

	res, _ := client.Convert(context.Background(), "XAUUSD", "VND", 1)
	fmt.Println(res["message"], res["result"])
}
```

## 5. Quy Tắc Tường Lửa Tên Miền (`Allow Host` & `Disable Host`)

Hệ thống hỗ trợ kiểm soát truy cập theo tên miền và địa chỉ IP nhằm bảo vệ khóa API của doanh nghiệp:

1. **Tự Động Chuẩn Hóa Link / URL Về Hostname Chuẩn**: Mọi đường dẫn URL hoặc IP cấu hình trên Cổng Khách Hàng hoặc truyền vào tham số `clientHost` của SDK đều được tự động bóc tách về định dạng hostname/IP chuẩn:
   * `https://domain.com/ex?test=1` $ightarrow$ `domain.com` (tự động khớp cả `domain.com` và `www.domain.com`)
   * `http://127.9.12.3:8080/api` $ightarrow$ `127.9.12.3`
   * `https://*.partner.vn/app` $ightarrow$ `*.partner.vn`
2. **Thứ Tự Ưu Tiên Kiểm Tra**:
   * **Kiểm tra `Disable Host` trước (Blacklist)**: Nếu định danh của request (`Origin`, `Referer`, `X-Client-Host` hoặc `Client IP`) khớp với `Disable Host`, cổng API lập tức từ chối với mã `HTTP 403 Forbidden` (`code: "HOST_DISABLED"`).
   * **Kiểm tra `Allow Host` (Whitelist)**: Nếu để trống (`""`) hoặc đặt là `*`, hệ thống cho phép mọi tên miền/IP không nằm trong danh sách chặn. Nếu có khai báo tên miền/IP, chỉ những request khớp chính xác, khớp IP hoặc khớp Wildcard (`*.domain.com`) mới được phép truy cập.
3. **Khuyến Nghị Khi Gọi Từ Máy Chủ Backend (Server-to-Server)**:
   * Thêm địa chỉ **IP Public của máy chủ Backend** vào mục `Allow Host`, hoặc truyền `clientHost: 'domain.com'` khi khởi tạo SDK (SDK sẽ tự động đính kèm header `X-Client-Host: domain.com`).
   * Hoặc tách riêng **Sub API Key** dành cho Backend (giới hạn theo IP máy chủ) và **Sub API Key** dành cho Frontend (giới hạn theo `*.domain.com`).

## 6. Bảng Tham Chiếu 26 Public Endpoints & Health Check

Xem chi tiết toàn bộ tham số và ví dụ phản hồi tại **[Tài Liệu Tích Hợp Toàn Diện (Tiếng Việt)](docs/vi/INTEGRATION_GUIDE.md)**.

## Giấy Phép (License)

Bộ thư viện Client SDK, tài liệu hướng dẫn và code mẫu trong kho lưu trữ này được phát hành theo giấy phép [MIT License](LICENSE).
