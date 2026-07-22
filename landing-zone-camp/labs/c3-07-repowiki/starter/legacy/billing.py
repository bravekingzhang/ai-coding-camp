import util
STATE = {}

def run(uid, items):
    total = 0
    for it in items:
        total += util.price(it) * it.get("n", 1)
    if STATE.get("vip_" + str(uid)):
        total = int(total * 0.9)
    STATE["last"] = total          # 隐式全局态，report.py 依赖它
    return util.fmt(total)
