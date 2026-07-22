# c1-04 context-map 匹配实验               ⏱ 25min | 能力域 2 | 判题 CI

## 背景
context-map 让 AI 按"改哪里 → 自动加载哪些规则"工作，是上下文工程从手工走向自动的第一步（详见 [handbook/methods.md](../../handbook/methods.md) 的 context-map 一节）。

## 任务
在 `starter/context-map.yaml` 基础上补充至少 2 条映射：
1. `api/**` 路径 → 加载后端 / API 相关规则（各团队规则文件名不同，填你团队真实的规则文件即可，示例：`rules/api-convention.md`）
2. `web/**` 路径 → 加载前端相关规则
每条引用的规则文件至少应在文件里能说清"它管什么"。并为每条写 `why:` 一句话说明。完成后把文件复制为本目录 `context-map.yaml` 提交。

## 判题
- 🟡 CI：≥3 条 match 规则、引用 ≥3 个 rules/ 文件、每条含 why
- 🟢 教练抽查：现场给一个新路径，你能说清会命中哪条、为什么

## 提交方式
分支 `camp/c1-04/<工号>`
