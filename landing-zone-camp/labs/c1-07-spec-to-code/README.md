# c1-07 从 Quick Spec 生成代码并跑通测试    ⏱ 30min | 能力域 5 | 判题 CI

## 背景
Spec 的价值在"可验证"。本关体验最小闭环：拿一份写好的 Quick Spec 喂给 AI → 生成实现 → 用 Spec 对应的测试验证。

## 任务
阅读 `starter/quick-spec.md`（slugify 函数），把 Spec 交给你的 AI 工具生成实现，
放到本目录 `src/slugify.py`（函数签名 `def slugify(text: str) -> str`）。
**不许自己手写** —— 重点练习"Spec 写清楚，AI 一次到位"；生成不达标就回去改 Spec 的表述再试。

## 判题
- 🟡 CI：`.verify/` 中依据 Spec 验收条件编写的 6 个测试全部通过
- 🟢 教练抽查：展示你的提示词 —— 是否只贴了 Spec 而没有额外口头补丁

## 提交方式
分支 `camp/c1-07/<工号>`
