# c2-09 Bugfix 三层描述法实战              ⏱ 40min | 能力域 7 | 判题 CI

## 背景
Bugfix 三层描述法（见 [handbook/methods.md](../../handbook/methods.md)）：不改代码，先把问题说清楚 —— 当前行为 / 期望行为 / **不变量**。回归测试先行（先红后绿），AI 只改需要改的。

## 任务
`starter/orders.py` 有一个线上 Bug：**已取消（CANCELLED）的订单**调用 `summarize()` 会崩（现有两个测试没覆盖到）。
1. 写 `bugfix-spec.md`：`## 当前行为`（含复现步骤与报错）/ `## 期望行为` / `## 不变量`（至少 2 条，如 PAID/CREATED 输出格式不变）
2. 在 `starter/test_orders.py` 追加回归测试（函数名含 `regression`），**先确认它红**
3. 让 AI 依据三层描述修复 `orders.py`，回归与既有测试全绿

## 判题
- 🟡 CI：三层描述齐全（不变量 ≥2 条）+ 存在 regression 测试 + 全部测试通过
- 🟢 教练抽查：演示"先红后绿"的两次运行记录

## 提交方式
分支 `camp/c2-09/<工号>`
