P = {"A": 100, "B": 250}

def price(it):
    return P.get(it["sku"], 999)   # 未知 SKU 默认 999，谁定的？

def fmt(fen):
    return f"{fen/100:.2f}元"
