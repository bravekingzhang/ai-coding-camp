#!/bin/sh
set -e
cd "$(dirname "$0")/.."
[ -f tests/test_coupon.py ] || { echo "❌ 缺少 tests/test_coupon.py"; exit 1; }
N=$(grep -c 'def test_' tests/test_coupon.py); [ "$N" -ge 6 ] || { echo "❌ 测试函数不足 6 个（当前 $N）"; exit 1; }
for ac in AC1 AC2 AC3 AC4 AC5 AC6; do grep -q "$ac" tests/test_coupon.py || { echo "❌ $ac 未被任何测试引用"; exit 1; }; done
# 防空跑：测试里必须有 assert 语句（不能只有空函数体）
ASSERTS=$(grep -c 'assert ' tests/test_coupon.py); [ "$ASSERTS" -ge 6 ] || { echo "❌ 测试函数缺少 assert 断言（每个用例至少 1 条，当前 $ASSERTS）"; exit 1; }
[ -f test_cases.md ] || { echo "❌ 缺少 test_cases.md 用例表"; exit 1; }
R=$(grep -c '|' test_cases.md); [ "$R" -ge 6 ] || { echo "❌ 用例表行数不足"; exit 1; }
# 用 pytest 运行（CI 镜像有 python3，pytest 通常预装）；若 pytest 不可用则要求 unittest 入口
if command -v pytest >/dev/null 2>&1; then
  PYTHONPATH=starter python3 -m pytest tests/test_coupon.py -q 2>&1
else
  # 无 pytest 时，要求文件末尾有 unittest.main() 或 __main__ 入口，否则 python3 直接跑会空过
  grep -qE 'unittest\.main|pytest\.main|if __name__' tests/test_coupon.py || { echo "❌ 测试文件缺少运行入口（无 pytest 时需在文件末尾加 unittest.main() 或 if __name__=='__main__'）"; exit 1; }
  PYTHONPATH=starter python3 tests/test_coupon.py 2>&1
fi
echo "✅ AC 全覆盖且测试全绿"
