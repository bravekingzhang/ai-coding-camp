# c2-10 安全基线：漏洞依赖与不安全用法修复   ⏱ 30min | 能力域 8 | 判题 CI

## 背景
AI 补代码时很喜欢照抄旧教程：老版本依赖 + 不安全的反序列化写法一起进仓库。本关按安全红线做一次最小整改。

## 任务
`starter/` 中：`requirements.txt` 钉在过老的 `PyYAML==5.1`；`loader.py` 使用了不受限的 `yaml.load(raw)`。
1. 升级依赖：`PyYAML>=6.0`
2. 改为安全加载：`yaml.safe_load(...)`
3. 写 `security-note.md`：本次两处整改各一句话 + 一条"以后如何在 CI 自动拦截"（依赖扫描/规则）

## 判题
- 🟡 CI：requirements 已升级 + 代码中无裸 `yaml.load(` + safe_load 就位 + note 三点齐全
- 🟢 教练抽查：说明为什么"能跑"不等于"安全"（不受限反序列化的风险类别即可，不需要利用细节）

## 提交方式
分支 `camp/c2-10/<工号>`
