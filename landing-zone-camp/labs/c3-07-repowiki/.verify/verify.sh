#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=docs/repo-wiki.md
[ -f "$F" ] || { echo "❌ 缺少 docs/repo-wiki.md"; exit 1; }
for sec in "## 模块地图" "## 关键流程" "## 隐藏耦合与风险点" "## 改造入手建议"; do grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }; done
for f in billing.py util.py report.py; do grep -q "$f" "$F" || { echo "❌ 未覆盖文件: $f"; exit 1; }; done
R=$(sed -n '/隐藏耦合/,/改造入手/p' "$F" | grep -cE '^\s*[-*0-9]'); [ "$R" -ge 3 ] || { echo "❌ 风险点不足 3 条（当前 $R）"; exit 1; }
echo "✅ 遗留系统已有可用上下文"
