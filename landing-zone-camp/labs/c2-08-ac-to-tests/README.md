# c2-08 从验收条件生成测试用例             ⏱ 35min | 能力域 7 | 判题 CI

## 背景
Spec 写成 EARS 的最大红利：**验收条件可以机械地翻译成测试**（test-generator skill 干的事）。本关手工+AI 走一遍这个翻译过程。

## 任务
`starter/coupon.py` 已实现优惠券核销，`starter/ac.md` 给了 6 条 AC（编号 AC1~AC6）。
1. 让 AI 依据 AC 生成 `tests/test_coupon.py`，每条 AC 至少一个测试函数，函数内注释标注 `# AC{n}`
2. 补一份 `test_cases.md` 用例表（用例号 | 对应AC | 输入 | 期望），≥6 行

## 判题
- 🟡 CI：测试全绿 + `def test_` ≥6 + AC1~AC6 全被引用 + 用例表 ≥6 行
- 🟢 教练抽查：指出哪条 AC 最容易被"看似覆盖实则没测到"（提示：AC5 的过期边界）

## 提交方式
分支 `camp/c2-08/<工号>`
