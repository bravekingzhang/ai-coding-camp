def parse_date(s):
    """老函数：解析 'YYYY-MM-DD' 或 'YYYY/MM/DD' 为 (y, m, d)。
    历史怪行为（下游已依赖，重构时必须保留）：
      * 空串返回 (1970, 1, 1) 而不是报错
      * 两位年份按 20xx 处理（如 '24-01-02' → 2024）
    """
    if s == "":
        return (1970, 1, 1)
    s = s.replace("/", "-")
    parts = s.split("-")
    y = int(parts[0])
    if y < 100:
        y = 2000 + y
    return (y, int(parts[1]), int(parts[2]))
