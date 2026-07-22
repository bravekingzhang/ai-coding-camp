#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=bugfix-spec.md
[ -f "$F" ] || { echo "❌ 缺少 bugfix-spec.md"; exit 1; }
for sec in "## 当前行为" "## 期望行为" "## 不变量"; do grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }; done
INV=$(sed -n '/## 不变量/,$p' "$F" | grep -cE '^\s*[-*0-9]'); [ "$INV" -ge 2 ] || { echo "❌ 不变量至少 2 条（当前 $INV）"; exit 1; }
grep -q 'regression' starter/test_orders.py || { echo "❌ 缺少 regression 回归测试"; exit 1; }
python3 starter/test_orders.py && echo "✅ 三层描述完备，回归通过且不变量守住"
