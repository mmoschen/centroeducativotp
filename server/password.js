import crypto from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes('$')) return false;

  const [salt, hash] = stored.split('$');
  if (!salt || !hash) return false;

  const candidate = crypto.scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, 'hex');

  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}
