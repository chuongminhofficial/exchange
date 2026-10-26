# Security Policy / Chính Sách Bảo Mật

## 🇬🇧 English

### Source Code & Infrastructure Isolation
This public repository (`exchange-sdk`) contains **only** the public client SDKs, TypeScript declarations, Postman collections, and integration examples for `https://api.l.lc/exchange`.
* **Never commit live API keys** (`sk_live_...`), `.env` files, database dumps (`.sql`), or internal backend binaries to public forks or pull requests.
* Always store your `EXCHANGE_API_KEY` in environment variables or secret managers and enable **`Allow Host`** restrictions in your account dashboard.

### Reporting a Vulnerability
If you discover a security issue in any of the client SDKs or the API gateway, please report it privately to the security team rather than opening a public GitHub issue.

## 🇻🇳 Tiếng Việt

### Cô Lập Mã Nguồn Lõi & Bảo Vệ Khóa API
Kho lưu trữ công khai này chỉ chứa **Bộ thư viện tích hợp Client SDK, tài liệu hướng dẫn và Postman Collection** dành cho khách hàng của `https://api.l.lc/exchange`.
* **Tuyệt đối không đẩy (commit) khóa API thật** (`sk_live_...`), tệp cấu hình `.env`, tệp cơ sở dữ liệu (`.sql`) hoặc mã nguồn máy chủ nội bộ lên kho lưu trữ công khai.
* Luôn lưu trữ `EXCHANGE_API_KEY` trong biến môi trường (`Environment Variables`) và kích hoạt tường lửa tên miền **`Allow Host`** cho từng khóa API.
