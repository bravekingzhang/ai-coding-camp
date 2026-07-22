#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=findings.md
[ -f "$F" ] || { echo "❌ 缺少 findings.md"; exit 1; }
for sec in "## 安全" "## 正确性" "## 性能" "## 可维护性"; do grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }; done
grep -qiE "注入|injection|拼接" "$F" || { echo "❌ 安全维度未命中（提示：keyword 如何进 SQL）"; exit 1; }
grep -qE "边界|11|end|多.?1|off" "$F" || { echo "❌ 正确性维度未命中（提示：每页实际返回几条？）"; exit 1; }
grep -qiE "N\+1|循环.*(查询|SQL)|逐条查询" "$F" || { echo "❌ 性能维度未命中"; exit 1; }
grep -qE "743|魔法数|magic" "$F" || { echo "❌ 可维护性维度未命中"; exit 1; }
echo "✅ 四维全部命中"
