import * as crypto from 'crypto';

const KEY_PREFIX = 'ak_live_';

export function generateApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const secret = crypto.randomBytes(32).toString('hex');
  const rawKey = `${KEY_PREFIX}${secret}`;
  return {
    rawKey,
    keyPrefix: rawKey.slice(0, 16),
    keyHash: hashApiKey(rawKey),
  };
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function isApiKeyFormat(value: string): boolean {
  return value.startsWith(KEY_PREFIX) && value.length >= 24;
}

export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
