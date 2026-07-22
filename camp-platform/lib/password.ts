import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * 密码工具（纯 Node 内置 crypto，不引入任何依赖）。
 * 存储格式：scrypt:<salt hex>:<hash hex>
 */

const KEYLEN = 64;

/** 哈希明文密码，返回 scrypt:<salt>:<hash> 格式。 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEYLEN);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

/** 校验明文与存储的哈希是否匹配（常数时间比较，防时序攻击）。 */
export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'hex');
  const hash = Buffer.from(parts[2], 'hex');
  const test = scryptSync(plain, salt, KEYLEN);
  if (test.length !== hash.length) return false;
  return timingSafeEqual(test, hash);
}

/** 生成 8 位初始密码（大小写字母+数字，排除易混淆字符 0O1lI）。 */
export function generateInitialPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const buf = randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[buf[i] % chars.length];
  return out;
}
