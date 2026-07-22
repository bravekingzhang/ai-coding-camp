#!/bin/sh
set -e
cd "$(dirname "$0")/.."
[ -f tests/test_coupon.py ] || { echo "❌ 缺少 tests/test_coupon.py"; exit 1; }
N=$(grep -c 'def test_' tests/test_coupon.py); [ "$N" -ge 6 ] || { echo "❌ 测试函数不足 6 个（当前 $N）"; exit 1; }
for ac in AC1 AC2 AC3 AC4 AC5 AC6; do grep -q "$ac" tests/test_coupon.py || { echo "❌ $ac 未被任何测试引用"; exit 1; }; done
[ -f test_cases.md ] || { echo "❌ 缺少 test_cases.md 用例表"; exit 1; }
R=$(grep -c '|' test_cases.md); [ "$R" -ge 6 ] || { echo "❌ 用例表行数不足"; exit 1; }
PYTHONPATH=starter python3 tests/test_coupon.py && echo "✅ AC 全覆盖且测试全绿"
