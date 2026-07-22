#!/bin/sh
cd "$(dirname "$0")/.."
[ -f src/slugify.py ] || { echo "❌ 缺少 src/slugify.py"; exit 1; }
python3 .verify/test_slugify.py -v 2>&1 | tail -3
python3 .verify/test_slugify.py && echo "✅ 6/6 测试通过（Spec 兑现）"
