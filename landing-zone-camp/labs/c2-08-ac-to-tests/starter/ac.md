# 优惠券核销 · 验收条件
- AC1 WHEN 价格 10000 分、满减券 cut=3000、满 5000 可用、未过期 THEN 返回 code=0 且 final=7000
- AC2 WHEN 折扣券 percent=85、价格 10000 THEN final=8500
- AC3 WHEN 价格低于门槛 min_price_fen THEN code=41002
- AC4 WHEN 满减金额大于价格 THEN final=0（不出现负数）
- AC5 WHEN 券 expire_ts 恰好等于当前时间 THEN 视为未过期，正常核销
- AC6 WHEN 价格 ≤0 THEN code=40001
