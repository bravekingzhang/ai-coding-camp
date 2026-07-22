# c3-09 四阶段工作流完整走一遍               ⏱ 45min | 能力域 5 | 判题 CI

## 背景
L2 级改动配合复杂任务四阶段工作流（见 [handbook/methods.md](../../handbook/methods.md)）：头脑风暴 → 写计划 → 分步实现 → 对照验收验证。本关用一个小而完整的需求把四阶段各留一份产物。

## 任务
需求：给 c2-08 的优惠券模块新增"每人每券限用一次"能力（允许自设存储假设）。
在 `workflow/` 下产出四份文件并在 `workflow-log.md` 汇总：
`01-brainstorm.md`（≥2 个方案 + 取舍）/ `02-plan.md`（任务拆分 + 顺序）/ `03-impl-notes.md`（subagent 分工与产物链接）/ `04-verification.md`（对照 AC 的验证记录）。

## 判题
- 🟡 CI：四文件 + 汇总齐全；brainstorm 含 ≥2 方案；verification 引用了 AC
- 🟢 教练抽查：说明哪一阶段最该省（本例问题清楚时 brainstorm 可减配）——分级意识

## 提交方式
分支 `camp/c3-09/<工号>`
