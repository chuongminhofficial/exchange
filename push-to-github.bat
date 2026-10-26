@echo off
REM ============================================================================
REM ONE-CLICK GITHUB PUSH SCRIPT FOR WINDOWS (CMD / PowerShell)
REM KICH BAN DAY NHANH LEN GITHUB DANH CHO WINDOWS (Da an ma nguon goc)
REM ============================================================================
echo ==================================================================
echo   EXCHANGE SAAS SDK - GITHUB REPOSITORY PUBLISHER (WINDOWS)
echo ==================================================================

set REPO_URL=%~1
if "%REPO_URL%"=="" (
    set /p REPO_URL="Nhap link kho GitHub cua ban (VD: https://github.com/username/exchange-sdk.git): "
)

if "%REPO_URL%"=="" (
    echo [Loi] Ban chua nhap URL kho GitHub.
    pause
    exit /b 1
)

if not exist ".git" (
    git init
    git branch -M main
)

git add .
git commit -m "feat: release Exchange SaaS & SUE Real-Time API Official SDKs & Bilingual Docs (v4.0)" 2>nul

git remote remove origin 2>nul
git remote add origin "%REPO_URL%"
git branch -M main

echo Dang day len GitHub: %REPO_URL% ...
git push -u origin main

echo ==================================================================
echo   HOAN TAT! Kho GitHub cua ban da duoc day thanh cong.
echo ==================================================================
pause
