#!/usr/bin/env bash
# ============================================================================
# ONE-CLICK GITHUB PUSH SCRIPT (Linux / macOS / Git Bash)
# KỊCH BẢN ĐẨY NHANH LÊN KHO GITHUB (Đã ẩn hoàn toàn mã nguồn gốc)
# ============================================================================
set -e

echo "=================================================================="
echo "  EXCHANGE SAAS SDK — GITHUB REPOSITORY PUBLISHER"
echo "=================================================================="

if [ -z "$1" ]; then
  read -p "Enter your GitHub Repository URL (e.g. https://github.com/username/exchange-sdk.git): " REPO_URL
else
  REPO_URL="$1"
fi

if [ -z "$REPO_URL" ]; then
  echo "[Error] GitHub Repository URL is required."
  exit 1
fi

if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

git add .
git status --short

if ! git diff --cached --quiet; then
  git commit -m "feat: release Exchange SaaS & SUE Real-Time API Official SDKs & Bilingual Docs (v4.0)"
fi

if git remote | grep -q "^origin$"; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo "Pushing to $REPO_URL (branch: main)..."
git push -u origin main
echo "Done! Your public SDK repository is now live on GitHub."
