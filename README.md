# AI Coding Camp · 完整交付包

基于《Landing Zone AI Coding 转型框架》的 freeCodeCamp 式企业训练体系 —— 设计文档 + 训练平台 + 30 个训练题目，一包带走。

```
docs/                01 训练体系设计方案（四级认证/12周/机制设计）
                     02 平台技术架构设计（选型/领域模型/事件流）
camp-platform/       训练平台源码（Next.js 全栈，README 含启动步骤与 SSO 接入）
landing-zone-camp/   训练内容包：curriculum.yaml + 30 关（任务卡/starter/判题脚本）
                     + P1~P3 项目卡 + S1~S4 场景卡 + C4 四模块 + rubrics + 摸底题 + CI 模板
```

## 十分钟看懂这套系统怎么转
1. 学员在训练仓库做题，推分支 `camp/<关卡>/<工号>` → CI 跑该关 `.verify/verify.sh` → 回调平台
2. 平台记录判分事件并归约颜色：**CI 最多给 🟡，🟢 永远来自教练或跨组互测**
3. c2-02/c2-05 提交自动触发**跨组评审指派**；Skill 类关卡 🟢 由互测决定 —— 组织性协作是毕业条件，不是口号
4. 教练台抽样校准 LLM 预评（20%）；全营看板热力图暴露"整列变红"的教学问题
5. W6/W12 把跑稳的判题项迁入生产门禁 —— 训练营结束，规范留下

## 快速开始
1. 读 `docs/01`（30 分钟，了解机制）
2. 按 `camp-platform/README.md` 起平台（含演示账号与 mock LLM，可离线完整走通）
3. 把 `landing-zone-camp/` 推到内网 Git，套 `ci-templates/` 接好回调
4. 开营前：跑摸底三题分层；把 `rubrics/coach-keys.md` 移入教练私有仓库

## 诚实声明
平台代码在无外网环境编写、未经编译验证（详见 camp-platform/README「交付状态说明」）；
训练题目的全部可执行判题脚本与埋雷材料**已在本环境逐一自测通过**（哈希测验、隐藏测试、埋雷爆炸行为、JSON 校验器）。
