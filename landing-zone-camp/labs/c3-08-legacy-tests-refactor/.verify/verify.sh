#!/bin/sh
set -e
cd "$(dirname "$0")/.."
T=starter/test_date_parse.py
[ -f "$T" ] || { echo "❌ 缺少表征测试 $T"; exit 1; }
N=$(grep -c 'def test_' "$T"); [ "$N" -ge 4 ] || { echo "❌ 测试不足 4 个（当前 $N）"; exit 1; }
Q=$(grep -c 'def test_.*quirk' "$T"); [ "$Q" -ge 2 ] || { echo "❌ 钉住怪行为的 quirk 测试不足 2 个"; exit 1; }
grep -q 'def parse_date(s' starter/date_parse.py || { echo "❌ 函数签名被改动"; exit 1; }
python3 "$T" || { echo "❌ 测试未全绿"; exit 1; }
F=refactor-note.md
[ -f "$F" ] || { echo "❌ 缺少 refactor-note.md"; exit 1; }
grep -qE '1970|空串' "$F" || { echo "❌ note 未记录怪行为①"; exit 1; }
grep -qE '20|两位年' "$F" || { echo "❌ note 未记录怪行为②"; exit 1; }
echo "✅ 测试保护下完成安全重构"
