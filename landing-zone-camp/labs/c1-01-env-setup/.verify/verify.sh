#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=toolcheck.md
[ -f "$F" ] || { echo "❌ 缺少 toolcheck.md（从 starter/ 复制模板）"; exit 1; }
for sec in "工具名与版本" "版本命令输出" "配置文件路径" "一次生成的证据" "卡点"; do
  grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }
done
LINES=$(grep -vcE '^\s*(#|```|（|$)' "$F" || true)
[ "$LINES" -ge 5 ] || { echo "❌ 内容过少：请如实填写各字段（当前有效行 $LINES）"; exit 1; }
echo "✅ 工具自检单完整"
