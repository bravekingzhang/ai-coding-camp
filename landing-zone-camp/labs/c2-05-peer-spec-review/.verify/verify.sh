#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=reflection.md
[ -f "$F" ] || { echo "❌ 缺少 reflection.md"; exit 1; }
grep -q "最有价值" "$F" || { echo "❌ 缺少「最有价值问题」小节"; exit 1; }
grep -qE "我自己|自省|同样会犯" "$F" || { echo "❌ 缺少自省小节"; exit 1; }
echo "✅ 反思已提交；评审完成情况以平台记录为准"
