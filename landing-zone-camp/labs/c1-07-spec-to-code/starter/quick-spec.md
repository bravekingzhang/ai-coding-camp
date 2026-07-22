# slugify 工具函数 - Quick Spec
## 问题
需要把任意标题转成 URL 友好的 slug。
## 验收条件
- [ ] WHEN 输入 "Hello, World!" THEN 返回 "hello-world"
- [ ] WHEN 输入含连续空格/标点 THEN 折叠为单个连字符
- [ ] WHEN 输入首尾有分隔符（如 "--A_B--"）THEN 去除首尾连字符，返回 "a-b"
- [ ] WHEN 输入已是合法 slug（如 "already-slug"）THEN 原样返回
- [ ] WHEN 输入为空串或全是标点 THEN 返回 ""
## 影响范围
- 新增文件：src/slugify.py；无 DB / 无 API 变更
## 测试要点
- [ ] 正常路径 ×2　- [ ] 边界（空串、全标点、下划线）×3
