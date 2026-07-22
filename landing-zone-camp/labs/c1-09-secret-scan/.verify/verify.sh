#!/bin/sh
set -e
cd "$(dirname "$0")/.."
sh .verify/scan.sh || { echo "❌ 密钥仍在代码里"; exit 1; }
grep -q 'os.environ' starter/config.py || { echo "❌ config.py 应改为从环境变量读取"; exit 1; }
[ -f .env.example ] || { echo "❌ 缺少 .env.example"; exit 1; }
[ -f pre-commit.sh ] || { echo "❌ 缺少 pre-commit.sh（探测器要进流程）"; exit 1; }
grep -q 'scan' pre-commit.sh || { echo "❌ pre-commit.sh 应调用 scan"; exit 1; }
echo "✅ 泄漏已修复且拦截已就位"
