# c1-06 用 EARS 写 Quick Spec              ⏱ 25min | 能力域 3 | 判题 HYBRID（CI + LLM rubric）

## 背景
L1 快速 Spec 约 15 行、5 分钟写完，核心是把验收条件写成 EARS 句式：`WHEN [条件] THEN [期望结果]` —— 可测，AI 才有靶子。

## 任务
业务方原话："用户输错密码太多次要锁一会儿。"
把它写成 `quick-spec.md`，使用 [templates/l1-quick-spec.md](../../templates/l1-quick-spec.md) 的结构：
问题 / 验收条件（≥2 条正常 + ≥1 条异常，全部 WHEN…THEN…）/ 影响范围 / 测试要点。
自行做出并写明合理假设（几次算多？锁多久？）。

## 判题
- 🟡 CI：四节齐全、WHEN/THEN 句式 ≥3 条 → 进入 LLM rubric（可测性/异常流）预评
- 🟢 教练复核 LLM 预评为 GREEN 的样本

## 提交方式
分支 `camp/c1-06/<工号>`
