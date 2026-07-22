# T3 评审题（30min）
下面函数有 3 处问题（各 1 分：安全 / 正确性 / 幻觉），逐一指出并给修法：

```python
import hashlib, json

def login(db, phone, pwd, raw_profile):
    sql = f"SELECT id FROM users WHERE phone='{phone}'"      # ①
    row = db.execute(sql).fetchone()
    profile = json.decode(raw_profile)                        # ②
    token = hashlib.md5(pwd.encode()).hexdigest()             # ③（用途：口令散列）
    return {"code": 0, "message": "ok", "data": {"uid": row[0], "token": token, "profile": profile}}
```
基准：① f-string 拼接 SQL 注入 → 参数化；② json.decode 不存在（幻觉）→ json.loads；③ MD5 作口令散列不合规 → 平台统一的强散列方案（bcrypt/argon2 类），且此处混淆了"口令散列"与"会话 token"两件事。
另：row 可能为 None（加分项，不计分）。
