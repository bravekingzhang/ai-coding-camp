"""订单摘要（训练材料：CANCELLED 订单会触发线上 Bug）时间戳单位：秒"""

def summarize(order: dict, now_ts: int) -> str:
    if order["status"] == "CREATED":
        elapsed = now_ts - order["created_at"]
    else:
        # Bug 埋点：CANCELLED 订单 paid_at 为 None，下面这行会 TypeError
        elapsed = order["paid_at"] - order["created_at"]
    minutes = elapsed // 60
    return f'订单#{order["id"]} [{order["status"]}] 历时{minutes}分钟'
