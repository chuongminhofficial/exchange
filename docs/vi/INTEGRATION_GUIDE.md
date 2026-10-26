# Tài Liệu Tích Hợp Toàn Diện & Bộ SDK Chính Thức — Exchange SaaS & SUE Real-Time API (V4.0)

Tài liệu kỹ thuật chính thức dành cho lập trình viên và doanh nghiệp tích hợp hệ thống tỷ giá thời gian thực **Exchange SaaS & SUE Engine** (`https://api.l.lc/exchange`). Phiên bản V4.0 bổ sung cơ chế **Tự động chuyển đổi ngôn ngữ phản hồi JSON (`en` mặc định / `vi` Tiếng Việt)**, **Tường lửa tên miền Allow/Disable Host chuẩn thương mại (hỗ trợ cả Web CORS & Server-to-Server)**, và **Bộ SDK đa ngôn ngữ (JavaScript/TypeScript, PHP, Python, Go)**.

---

## 1. Kiến Trúc Kết Nối & Xác Thực Bảo Mật

### 1.1. Endpoint Gốc (Base URL)
- **Public Gateway URL**: `https://api.l.lc/exchange`
- **Hỗ trợ đường dẫn đầy đủ**: `https://api.l.lc/exchange/api/v1/...`
- **Hỗ trợ đường dẫn rút gọn**: `https://api.l.lc/exchange/rates`, `https://api.l.lc/exchange/convert`, `https://api.l.lc/exchange/health`

### 1.2. Phương Thức Truyền API Key
Mọi request tới 26 Public Endpoints yêu cầu xác thực bằng `API Key` thông qua 1 trong 3 cách (ưu tiên từ trên xuống):
1. **HTTP Header chuẩn (Khuyên dùng)**: `X-API-Key: sk_live_xxxxxx`
2. **Authorization Bearer Header**: `Authorization: Bearer sk_live_xxxxxx`
3. **Query Parameter**: `?api_key=sk_live_xxxxxx`

---

## 2. Cơ Chế Chuyển Đổi Ngôn Ngữ Phản Hồi JSON Tự Động (`en` / `vi`)

Hệ thống hỗ trợ tự động chuyển đổi ngôn ngữ trong JSON phản hồi (bao gồm cả **thông báo trạng thái/lỗi `message`**, **tên tài sản `name`**, và **danh mục `supported_categories`**) với độ trễ **0ms** nhờ bộ đệm Pre-render `[]byte` kép trong RAM:

- **Ngôn ngữ mặc định (khi không truyền)**: Tiếng Anh (`en`).
- **Ngôn ngữ hỗ trợ**: Tiếng Anh (`en`) và Tiếng Việt (`vi`).

### Cách kích hoạt ngôn ngữ trong Request (theo thứ tự ưu tiên):
1. **Query Parameter**: Thêm `?lang=vi` hoặc `?lang=en` (hoặc `?locale=vi`).
2. **Custom Header**: `X-Language: vi` hoặc `X-Language: en`.
3. **Standard HTTP Header**: `Accept-Language: vi-VN,vi;q=0.9` hoặc `Accept-Language: en-US,en;q=0.9`.

### Ví dụ Phản Hồi JSON Theo Ngôn Ngữ (`GET /api/v1/convert?from=XAUUSD&to=VND&amount=1`)

**Mặc định (`?lang=en` hoặc không truyền `lang`):**
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

**Khi truyền `?lang=vi` (hoặc Header `Accept-Language: vi`):**
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

---

## 3. Quy Tắc Tường Lửa Tên Miền (`Allow Host` & `Disable Host`) Chuẩn Thương Mại

### 3.1. Tự Động Chuẩn Hóa Link / URL Về Hostname Chuẩn
Trên Cổng Quản Lý Khách Hàng (Customer Portal) cũng như tại lớp API Gateway và trong tất cả các bộ SDK chính thức, mọi đường dẫn URL hoặc IP do người dùng khai báo đều được tự động bóc tách về định dạng hostname/IP chuẩn:
- `https://domain.com` $\rightarrow$ `domain.com`
- `http://domain.com/ex?test=1` $\rightarrow$ `domain.com`
- `http://127.9.12.3:8080/api` $\rightarrow$ `127.9.12.3`
- `https://*.partner.vn/app` $\rightarrow$ `*.partner.vn`

### 3.2. Quy Tắc Chống Xung Đột & Thứ Tự Ưu Tiên
1. **Chống xung đột tuyệt đối**: Nếu một tên miền/IP đã nằm trong `Allow Host` thì hệ thống sẽ **chặn không cho phép thêm vào `Disable Host`** (và ngược lại).
2. **Kiểm tra `Disable Host` trước (Blacklist)**: Nếu bất kỳ định danh nào của request (`Origin`, `Referer`, `X-Client-Host`, hoặc `Client IP`) khớp với `Disable Host`, hệ thống lập tức trả về `HTTP 403 Forbidden` (`code: "HOST_DISABLED"`).
3. **Kiểm tra `Allow Host` (Whitelist)**:
   - Nếu `Allow Host` **để trống (`""`) hoặc là `*`**: Cho phép mọi tên miền và IP truy cập (trừ những tên miền nằm trong `Disable Host`).
   - Nếu `Allow Host` **có khai báo tên miền/IP**: Chỉ những request có định danh khớp với danh sách `Allow Host` mới được phép truy cập. Hỗ trợ cả khớp chính xác (`domain.com` tự động khớp cả `www.domain.com`), khớp địa chỉ IP (`127.9.12.3`), và khớp Wildcard (`*.domain.com`).

### 3.3. Hướng Dẫn Khi Gọi Từ Backend Server-to-Server (Khi Đã Bật `Allow Host`)
- **Khi gọi từ Trình duyệt (Frontend JS)**: Trình duyệt tự động đính kèm header `Origin` và `Referer` chứa tên miền website của bạn nên hệ thống tự động nhận diện.
- **Khi gọi từ Backend Server (PHP, Node.js, Python, Go, cURL)**: Do cuộc gọi từ Server không tự sinh `Origin` của trình duyệt, bạn có 2 cách chuẩn thương mại & bảo mật:
  - **Cách 1 (Khuyên dùng cho Production)**: Thêm địa chỉ **IP Public của máy chủ Backend** (ví dụ `127.9.12.3`) hoặc tên miền của bạn vào mục `Allow Host`. Nếu dùng tên miền, khởi tạo SDK với tham số `clientHost: 'domain.com'` (SDK sẽ tự động gửi kèm header `X-Client-Host: domain.com` và `Origin: https://domain.com`).
  - **Cách 2**: Tách riêng 1 Sub API Key tại tab **Quản Lý Đa API Key** dành riêng cho Backend với cấu hình `Allow Host Override` là IP của máy chủ Backend, và 1 Sub API Key dành cho Frontend với `Allow Host Override` là `*.domain.com`.

---

## 4. Hướng Dẫn Sử Dụng Bộ SDK Chính Thức (4 Ngôn Ngữ)

### 4.1. JavaScript / TypeScript SDK (`exchange_sdk.js`)

Hỗ trợ **Node.js (v18+)**, **Next.js / Nuxt.js**, **React / Vue**, và **Browser**.

```javascript
const { ExchangeClient, ExchangeAPIError } = require('./exchange_sdk.js');

// 1. Khởi tạo Client (Mặc định ngôn ngữ 'en', tự động chuẩn hóa clientHost)
const client = new ExchangeClient({
  apiKey: 'sk_live_your_api_key',
  baseUrl: 'https://api.l.lc/exchange',
  lang: 'en', // Mặc định 'en', đổi sang 'vi' nếu muốn phản hồi Tiếng Việt
  clientHost: 'https://domain.com/ex', // Tự động chuẩn hóa thành 'domain.com'
  timeoutMs: 8000
});

async function runDemo() {
  try {
    // Lấy tỷ giá Vàng giao ngay (XAUUSD) bằng tiếng Anh (mặc định)
    const goldEN = await client.getSymbolRate('XAUUSD');
    console.log('Gold (EN):', goldEN.data.name, goldEN.data.price_usd);

    // Chuyển đổi sang Tiếng Việt ngay trong từng lệnh gọi hoặc toàn cục
    const convVI = await client.convert('USD', 'VND', 100, { lang: 'vi' });
    console.log('Quy đổi (VI):', convVI.message, convVI.result);

    // Lấy bảng ma trận tỷ giá đa tiền tệ cho E-commerce
    const matrix = await client.getCrossMatrix('USD', ['VND', 'EUR', 'JPY', 'BTC', 'XAUUSD'], 50);
    console.log('Matrix:', matrix.matrix);

    // Định giá danh mục đầu tư thời gian thực
    const portfolio = await client.valuatePortfolio({ BTC: 1.5, ETH: 10, XAUUSD: 5 }, 'USD', { lang: 'vi' });
    console.log('Tổng giá trị danh mục (USD):', portfolio.total_value_usd);

    // Kiểm tra hạn ngạch Quota và công nợ SUE
    const status = await client.getAccountStatus();
    console.log('Quota tháng đã dùng:', status.realtime_quota_usage.month_used);
  } catch (err) {
    if (err instanceof ExchangeAPIError) {
      console.error(`Lỗi API [${err.statusCode} - ${err.errorCode}]: ${err.message}`);
    } else {
      console.error('Lỗi kết nối:', err);
    }
  }
}

runDemo();
```

---

### 4.2. PHP SDK (`ExchangeSDK.php`)

Tương thích **PHP 7.4 / 8.0 / 8.1 / 8.2 / 8.3**, hỗ trợ Laravel, Symfony, WordPress, hoặc PHP thuần. Tích hợp sẵn **Persistent cURL Keep-Alive** siêu tốc.

```php
<?php
require_once __DIR__ . '/ExchangeSDK.php';

use ExchangeSaaS\ExchangeClient;
use ExchangeSaaS\ExchangeAPIException;

try {
    // Khởi tạo SDK (Mặc định lang = 'en', tự động chuẩn hóa link client_host về 'domain.com')
    $client = new ExchangeClient('sk_live_your_api_key', [
        'base_url'    => 'https://api.l.lc/exchange',
        'lang'        => 'en',                  // Mặc định 'en', hoặc truyền 'vi'
        'client_host' => 'https://domain.com/ex', // Tự động chuẩn hóa thành 'domain.com'
        'timeout'     => 10,
    ]);

    // 1. Lấy giá thời gian thực của nhiều mã cùng lúc (Batch)
    $latest = $client->getLatestBatch(['EURUSD', 'XAUUSD', 'BTC', 'VND']);
    print_r($latest['data']);

    // 2. Quy đổi tiền tệ với phản hồi Tiếng Việt (lang = 'vi')
    $convertVI = $client->convert('BTC', 'VND', 0.5, 'vi');
    echo $convertVI['message'] . " Kết quả: " . number_format($convertVI['result']) . " VND\n";

    // 3. Lấy dữ liệu Nến lịch sử OHLCV (khung 1h, 100 cây nến)
    $ohlc = $client->getOHLC('XAUUSD', '1h', 100);
    echo "Số lượng nến XAUUSD: " . count($ohlc['bars'] ?? []) . "\n";

    // 4. Đổi ngôn ngữ mặc định sang Tiếng Việt cho toàn bộ các lệnh tiếp theo
    $client->setLanguage('vi');
    $summary = $client->getMarketSummary();
    echo "Thông điệp: " . $summary['message'] . "\n";

} catch (ExchangeAPIException $e) {
    echo "Lỗi API (HTTP {$e->statusCode} - {$e->errorCode}): {$e->getMessage()}\n";
}
```

---

### 4.3. Python SDK (`exchange_sdk.py`)

Tương thích **Python 3.8+**, hoạt động độc lập 100% với thư viện chuẩn (không bắt buộc cài thêm pip package ngoài), phù hợp cho Django, FastAPI, Flask, AI Agent và Quant Trading Bot.

```python
from exchange_sdk import ExchangeClient, ExchangeAPIError

# Khởi tạo Client (mặc định lang='en')
client = ExchangeClient(
    api_key="sk_live_your_api_key",
    base_url="https://api.l.lc/exchange",
    lang="en",
    client_host="https://domain.com/ex",  # Tự động chuẩn hóa thành 'domain.com'
)

try:
    # 1. Tra cứu tỷ giá Vàng XAUUSD (Tiếng Anh mặc định)
    gold = client.get_symbol_rate("XAUUSD")
    print("Gold EN:", gold["data"]["name"], gold["data"]["price_usd"])

    # 2. Tra cứu tỷ giá bằng Tiếng Việt (lang='vi')
    gold_vi = client.get_symbol_rate("XAUUSD", lang="vi")
    print("Gold VI:", gold_vi["data"]["name"], "->", gold_vi["message"])

    # 3. Quy đổi 100 USD sang VND
    conv = client.convert("USD", "VND", amount=100, lang="vi")
    print(f"100 USD = {conv['result']:,.0f} VND ({conv['message']})")

    # 4. Định giá danh mục đầu tư
    portfolio = client.valuate_portfolio({"BTC": 1.2, "ETH": 5, "XAUUSD": 3}, target_currency="USD")
    print("Total Portfolio USD:", portfolio["total_value_usd"])

except ExchangeAPIError as err:
    print(f"API Error [{err.status_code} {err.error_code}]: {err.message}")
```

---

### 4.4. Go SDK (`exchange_sdk.go`)

Dành cho các hệ thống Microservices và Trading Engine hiệu năng cao viết bằng **Go (Golang)**.

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
		Lang:       exchangesdk.LangEN,          // Mặc định "en", hoặc exchangesdk.LangVI ("vi")
		ClientHost: "https://domain.com/ex",     // Tự động chuẩn hóa thành "domain.com"
		Timeout:    8 * time.Second,
	})
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()

	// 1. Quy đổi tiền tệ với ngôn ngữ mặc định (EN)
	resEN, err := client.Convert(ctx, "USD", "VND", 100)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("EN Message:", resEN["message"], "Result:", resEN["result"])

	// 2. Chuyển sang Tiếng Việt (VI)
	client.SetLanguage(exchangesdk.LangVI)
	resVI, err := client.Convert(ctx, "XAUUSD", "VND", 1)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("VI Message:", resVI["message"], "Tên:", resVI["from_name"])
}
```

---

## 5. Bảng Tham Chiếu Toàn Bộ 26 Public Endpoints & Tham Số

Tất cả 26 Public Endpoints dưới đây đều hỗ trợ tham số `?lang=en` (mặc định) hoặc `?lang=vi`:

| STT | Nhóm | Phương thức & Đường dẫn | Đường dẫn rút gọn | Tham số Query mẫu | Mô tả chức năng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | **Tỷ Giá RAM** | `GET /api/v1/rates` | `GET /rates` | `?symbol=XAUUSD&lang=vi` | Lấy toàn bộ 500+ mã hoặc tra cứu 1 mã / 1 nhóm từ bộ đệm RAM `[]byte` |
| 02 | **Tỷ Giá RAM** | `GET /api/v1/rates/fiat` | `GET /rates/fiat` | `?lang=vi` | Danh sách 150+ đồng tiền pháp định ISO-4217 (`VND`, `USD`, `EUR`, `JPY`...) |
| 03 | **Tỷ Giá RAM** | `GET /api/v1/rates/crypto` | `GET /rates/crypto` | `?lang=vi` | Danh sách 310+ đồng tiền điện tử (`BTC`, `ETH`, `SOL`, `BNB`, `USDT`...) |
| 04 | **Tỷ Giá RAM** | `GET /api/v1/rates/forex` | `GET /rates/forex` | `?lang=vi` | Các cặp tỷ giá ngoại hối chính & chéo (`EURUSD`, `GBPUSD`, `USDJPY`, `USDVND`...) |
| 05 | **Tỷ Giá RAM** | `GET /api/v1/rates/commodities` | `GET /rates/commodities` | `?lang=vi` | Kim loại quý và năng lượng (`XAUUSD`, `XAGUSD`, `WTIUSD`, `BRENTUSD`...) |
| 06 | **Tỷ Giá RAM** | `GET /api/v1/rates/indices` | `GET /rates/indices` | `?lang=vi` | Chỉ số chứng khoán toàn cầu (`SPX500`, `NAS100`, `US30`, `DXY`, `VNINDEX`...) |
| 07 | **Thị Trường** | `GET /api/v1/latest` | `GET /latest` | `?symbols=EURUSD,XAUUSD,BTC&lang=vi` | Lấy giá Bid/Ask/Mid thời gian thực của nhiều mã cùng lúc |
| 08 | **Thị Trường** | `GET /api/v1/active` | `GET /active` | `?lang=en` | Danh sách toàn bộ các mã đang có luồng tick trực tuyến từ SignalR |
| 09 | **Thị Trường** | `GET /api/v1/symbols/search` | `GET /symbols/search` | `?q=Vàng&limit=30&lang=vi` | Tìm kiếm mã theo tên tiếng Anh/tiếng Việt hoặc ký hiệu và lọc phân khúc |
| 10 | **Thị Trường** | `GET /api/v1/market/gainers` | `GET /market/gainers` | `?lang=vi` | Top 20 tài sản tăng trưởng % 24h mạnh nhất |
| 11 | **Thị Trường** | `GET /api/v1/market/losers` | `GET /market/losers` | `?lang=vi` | Top 20 tài sản giảm % 24h sâu nhất |
| 12 | **Thị Trường** | `GET /api/v1/market/most-active` | `GET /market/most-active` | `?lang=vi` | Top 20 tài sản có khối lượng giao dịch 24h lớn nhất |
| 13 | **Thị Trường** | `GET /api/v1/market/summary` | `GET /market/summary` | `?lang=vi` | Tổng quan độ rộng thị trường (số mã tăng, giảm, đứng giá) |
| 14 | **Nến & Tick** | `GET /api/v1/ohlc` | `GET /ohlc` | `?symbol=XAUUSD&interval=1h&limit=100` | Dữ liệu nến lịch sử OHLCV (`1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`) |
| 15 | **Nến & Tick** | `GET /api/v1/tick-history` | `GET /tick-history` | `?symbol=EURUSD&count=50` | Lịch sử các bước khớp giá (Tick) gần nhất của một mã tài sản |
| 16 | **Lịch & Tin** | `GET /api/v1/calendar` | `GET /calendar` | `?countries=US,EU,JP&importance=high` | Lịch kinh tế vĩ mô 54 quốc gia (CPI, Nonfarm, Lãi suất FED/ECB) |
| 17 | **Lịch & Tin** | `GET /api/v1/calendar/upcoming` | `GET /calendar/upcoming` | `?importance=high&limit=20` | Các sự kiện kinh tế quan trọng sắp công bố trong những giờ tới |
| 18 | **Lịch & Tin** | `GET /api/v1/calendar/countries` | `GET /calendar/countries` | `None` | Danh sách các quốc gia và đồng tiền hỗ trợ trong lịch kinh tế |
| 19 | **Lịch & Tin** | `GET /api/v1/news/market` | `GET /news/market` | `?symbol=XAUUSD&maxResults=10` | Tin tức thị trường ngoại hối, vàng, hàng hóa và tiền điện tử |
| 20 | **Lịch & Tin** | `GET /api/v1/news/hn` | `GET /news/hn` | `?q=bitcoin&maxResults=10` | Tin tức công nghệ, Fintech và Crypto từ Hacker News |
| 21 | **Công Cụ SaaS** | `GET /api/v1/convert` | `GET /convert` | `?from=BTC&to=VND&amount=1.5&lang=vi` | Quy đổi tức thì giữa bất kỳ đồng Fiat, Crypto hay Vàng (`XAUUSD`) |
| 22 | **Công Cụ SaaS** | `GET /api/v1/saas/matrix` | `GET /saas/matrix` | `?base=USD&targets=VND,EUR,BTC&amount=100` | Bảng ma trận tỷ giá chéo phục vụ thanh toán E-commerce đa quốc gia |
| 23 | **Công Cụ SaaS** | `GET /api/v1/saas/portfolio` | `GET /saas/portfolio` | `?holdings=BTC:1.5,XAUUSD:5&target=USD` | Tính tổng giá trị và tỷ trọng danh mục đầu tư đa tài sản thời gian thực |
| 24 | **Công Cụ SaaS** | `GET /api/v1/saas/embed-ticker` | `GET /saas/embed-ticker` | `?symbols=EURUSD,USDVND,XAUUSD,BTC&lang=vi` | Payload JSON siêu gọn để nhúng thanh chạy Marquee Ticker lên website |
| 25 | **Công Cụ SaaS** | `GET /api/v1/exchange/catalog` | `GET /exchange/catalog` | `?lang=vi` | Siêu dữ liệu tổng hợp các nhóm danh mục tài sản đang hỗ trợ trong RAM |
| 26 | **Tài Khoản** | `GET /api/v1/account/status` | `GET /account/status` | `?lang=vi` | Tra cứu bộ đếm Quota Phút/Giờ/Ngày/Tháng, quyền Endpoint và công nợ SUE |

---

## 6. Bảng Mã Lỗi Chuẩn Hóa (Song Ngữ `en` / `vi`)

| HTTP Code | Mã Lỗi (`code`) | Header `X-Quota-Status` | Ý Nghĩa & Cách Xử Lý |
| :--- | :--- | :--- | :--- |
| `401` | `UNAUTHORIZED` | `-` | Thiếu `API Key`. Hãy truyền qua header `X-API-Key` hoặc `?api_key=`. |
| `403` | `FORBIDDEN` | `-` | `API Key` không tồn tại hoặc tài khoản/khóa đã bị tạm ngưng (`is_active = false`). |
| `403` | `HOST_DISABLED` | `HOST_DISABLED` | Tên miền hoặc IP của bạn nằm trong danh sách bị chặn (`Disable Host`). |
| `403` | `HOST_NOT_ALLOWED` | `HOST_NOT_ALLOWED` | Tài khoản đã bật giới hạn `Allow Host` nhưng tên miền/IP gọi lên chưa nằm trong danh sách cho phép (nếu gọi từ Backend, hãy truyền header `X-Client-Host` hoặc thêm IP server vào `Allow Host`). |
| `403` | `ENDPOINT_FORBIDDEN` | `ENDPOINT_DENIED_*` | Gói cước hiện tại không bao gồm quyền truy cập Endpoint này. |
| `403` | `DATA_CATEGORY_NOT_ALLOWED` | `-` | Gói cước hiện tại không bao gồm nhóm dữ liệu này (ví dụ gói FREE chỉ mở `fiat,crypto`). |
| `404` | `SYMBOL_NOT_FOUND` | `-` | Mã tiền tệ hoặc tài sản yêu cầu không tồn tại trong bộ nhớ. |
| `429` | `QUOTA_EXCEEDED` | `LIMIT_EXCEEDED_*` | Vượt quá hạn ngạch Quota theo Phút/Giờ/Ngày/Tháng hoặc Tổng. Nâng cấp lên gói **SUE** để mở khóa không giới hạn. |
