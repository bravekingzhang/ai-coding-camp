# c3-05 MCP 接入企业文档并可溯源引用        ⏱ 35min | 能力域 12 | 判题 CI

## 背景
MCP 打通企业业务知识后，AI 的回答才能"有出处"。本关配置一个 filesystem 型 company-docs MCP，并证明生成结果确实引用了内部文档。

## 任务
1. 在你的工具中配置 `company-docs`（filesystem 型 MCP server，指向 `starter/docs/` 目录），配置内容存为 `mcp-config.json`（合法 JSON，含 server 定义与 allowed directories）
2. 提问："我们的接口错误码规范是什么？"要求 AI 回答并**标注来源文件**
3. 把问答原文存 `transcript.md`，须含一行 `来源: error-codes.md`

## 判题
- 🟡 CI：mcp-config.json 为合法 JSON 且含 filesystem server 定义；transcript 含来源行且内容与文档一致（41xxx 开头）
- 🟢 教练抽查：把 docs 换成同事目录，你能说明权限边界怎么设（allowed directories）

## 提交方式
分支 `camp/c3-05/<工号>`
