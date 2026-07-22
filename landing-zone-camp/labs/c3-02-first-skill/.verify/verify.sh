#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=skills/pagination-deep-scroll/SKILL.md
[ -f "$F" ] || { echo "❌ 缺少 $F"; exit 1; }
head -1 "$F" | grep -q '^---$' || { echo "❌ 缺少 YAML frontmatter"; exit 1; }
for k in "name:" "description:" "version:" "owner:" "tags:"; do grep -q "$k" "$F" || { echo "❌ frontmatter 缺字段: $k"; exit 1; }; done
for sec in "触发时机" "步骤" "反例" "边界" "维护信息"; do grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }; done
grep -qE "游标|WHERE id" "$F" || { echo "❌ 步骤应包含具体解法（游标翻页）"; exit 1; }
echo "✅ 结构合格 → LLM 预评 → 等待跨组互测定 🟢"
