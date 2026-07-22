# c1-02 Rules 与 Skill 加载验证            ⏱ 20min | 能力域 2 | 判题 CI

## 背景
规则写了不等于生效。Qoder 需 `./.qoder/rules/` 与 `AGENTS.md` 双生效，Claude Code 读 `AGENTS.md`/CLAUDE.md —— 本关验证你的工具真的"看见"了团队规则。

## 任务
1. 把 `starter/rules/backend.md` 按你的工具要求放到正确位置（AGENTS.md 引用它或复制进工具规则目录）
2. 让 AI 生成一个"查询用户信息"的接口处理函数（任意语言）
3. 把生成结果原样粘贴进 `loadcheck.md`，并补一节「工具配置证据」（规则文件所在路径、加载方式）

规则文件里有一条团队约定：**所有对外接口返回体必须包含 code/message/data 三段**。若 AI 的产物遵守了它，说明规则已加载。

## 判题
- 🟡 CI：loadcheck.md 存在，生成结果同时含 code、message、data，且有「工具配置证据」一节
- 🟢 教练抽查：证据可复现（换台机器照做也能生效）

## 提交方式
分支 `camp/c1-02/<工号>`
