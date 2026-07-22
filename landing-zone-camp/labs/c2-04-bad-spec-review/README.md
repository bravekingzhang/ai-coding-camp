# c2-04 给这份坏 Spec 挑刺                 ⏱ 30min | 能力域 4 | 判题 HYBRID（CI + LLM + 教练）

## 背景
这份「消息通知功能」L2 Spec 的作者赶时间，埋了 **8 处典型缺陷**：验收条件不可测 ×2、异常流缺失 ×2、无幂等设计、无回滚方案、影响范围漏写、与现有 API 约定冲突。

## 任务
1. 用 Review Checklist 审查 `starter/bad-spec.md`
2. 写 `findings.md`：编号 1~8，每条 `缺陷位置 | 问题类型 | 为什么有害 | 改法`
3. 任选 3 处，在 `rewrite.md` 中给出合格改写

## 判题
- 🟡 CI 格式（≥6 条编号发现）+ LLM 按 review-quality rubric 预评命中 ≥6/8
- 🟢 8 处全中且改写通过教练复核

## 提交方式
分支 `camp/c2-04/<工号>`
