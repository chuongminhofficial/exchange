# Contributing Guidelines / Hướng Dẫn Đóng Góp

## 🇬🇧 English
We welcome pull requests improving the client SDKs (`sdk/js`, `sdk/php`, `sdk/python`, `sdk/go`), adding framework-specific examples (`examples/`), or refining bilingual documentation (`docs/en`, `docs/vi`).

1. Fork this repository and create a feature branch (`git checkout -b feat/improve-sdk`).
2. Ensure zero external runtime dependencies are added to the core SDKs unless strictly optional.
3. Verify that all methods support both `en` (default) and `vi` localization and preserve `normalizeHostname` behavior.
4. Open a Pull Request with a clear summary in English or Vietnamese.

## 🇻🇳 Tiếng Việt
Chúng tôi hoan nghênh mọi đóng góp nhằm nâng cấp bộ SDK (`sdk/js`, `sdk/php`, `sdk/python`, `sdk/go`), bổ sung ví dụ tích hợp (`examples/`) hoặc hoàn thiện tài liệu song ngữ (`docs/en`, `docs/vi`).

1. Fork kho lưu trữ và tạo nhánh mới (`git checkout -b feat/nang-cap-sdk`).
2. Đảm bảo giữ nguyên triết lý gọn nhẹ, không phụ thuộc thư viện ngoài của các SDK.
3. Đảm bảo mọi hàm mới đều hỗ trợ tham số ngôn ngữ `en` / `vi` và chuẩn hóa `clientHost`.
4. Tạo Pull Request mô tả rõ thay đổi bằng Tiếng Anh hoặc Tiếng Việt.
