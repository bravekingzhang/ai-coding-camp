import billing

def daily():
    # 依赖 billing.STATE["last"]（时序耦合：必须先 run 再 daily）
    return "今日最后一单：" + str(billing.STATE.get("last", "无"))
