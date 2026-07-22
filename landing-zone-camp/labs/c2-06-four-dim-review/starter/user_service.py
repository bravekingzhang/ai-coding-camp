"""用户查询服务（训练材料：四个维度各埋 1 处问题）"""
import sqlite3

def search_users(db: sqlite3.Connection, keyword: str, page: int):
    # [?] 拼接 SQL
    sql = "SELECT id, name FROM users WHERE name LIKE '%" + keyword + "%'"
    rows = db.execute(sql).fetchall()

    # [?] 分页切片边界
    start = (page - 1) * 10
    end = page * 10 + 1
    page_rows = rows[start:end]

    result = []
    for uid, name in page_rows:
        # [?] 循环内逐条查询
        orders = db.execute("SELECT COUNT(*) FROM orders WHERE user_id=?", (uid,)).fetchone()[0]
        # [?] 743 是什么？
        vip = orders > 743
        result.append({"id": uid, "name": name, "orders": orders, "vip": vip})
    return result
