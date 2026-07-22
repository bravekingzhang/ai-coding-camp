"""优惠券核销（实现已就绪，等你依据 AC 出测试）金额单位：分"""

def apply_coupon(price_fen: int, coupon: dict, now_ts: int) -> dict:
    if price_fen <= 0:
        return {"code": 40001, "message": "invalid price", "data": None}
    if coupon.get("expire_ts", 0) < now_ts:
        return {"code": 41001, "message": "coupon expired", "data": None}
    if price_fen < coupon.get("min_price_fen", 0):
        return {"code": 41002, "message": "below threshold", "data": None}
    kind = coupon.get("kind")
    if kind == "CUT":          # 满减
        final = max(price_fen - coupon["cut_fen"], 0)
    elif kind == "PERCENT":    # 折扣，percent=85 表示 85 折
        final = price_fen * coupon["percent"] // 100
    else:
        return {"code": 41003, "message": "unknown coupon kind", "data": None}
    return {"code": 0, "message": "ok", "data": {"final_fen": final}}
