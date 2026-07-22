---
name: mysql-slow-query
description: 定位并优化 MySQL 慢查询：从慢日志到执行计划到索引方案
version: 1.2.0
owner: dba-team
tags: [mysql, performance]
---
# MySQL 慢查询排查

## 触发时机
接口 P99 突增、慢日志出现 >1s 语句、CPU 高但 QPS 不高。

## 步骤
1. 拉慢日志：`mysqldumpslow -s t -t 10 slow.log`
2. 对 Top 语句执行 `EXPLAIN`，关注 type=ALL 与 rows 估算
3. 判定：缺索引 / 索引失效（函数包字段、隐式转换）/ 深分页
4. 给出索引方案并评估写放大；深分页改游标（WHERE id > ? LIMIT n）

## 反例
- 不要上来就加索引：先确认不是隐式类型转换
- 不要用 OFFSET 十万级翻页"优化"——那是换个姿势慢

## 边界
- 分库分表场景本 Skill 不适用，转 @sharding-review
- 只读分析，不在生产直接执行变更

## 维护信息
最近验证：2026-05 · 适配 MySQL 5.7/8.0 · 变更记录见 CHANGELOG
