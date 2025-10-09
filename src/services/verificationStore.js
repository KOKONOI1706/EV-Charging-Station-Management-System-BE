// Simple in-memory verification store
// Stores { email -> { code, expiresAt, verified } }
const store = new Map();

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function createCode(email, code) {
  const expiresAt = Date.now() + CODE_TTL_MS;
  store.set(email, { code, expiresAt, verified: false });
}

export function verifyCode(email, code) {
  const entry = store.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(email);
    return false;
  }
  if (entry.code !== code) return false;
  entry.verified = true;
  store.set(email, entry);
  return true;
}

export function isVerified(email) {
  const entry = store.get(email);
  return entry?.verified === true;
}

export function cleanupExpired() {
  const now = Date.now();
  for (const [email, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(email);
  }
}

// Periodic cleanup
setInterval(cleanupExpired, 60 * 1000);

export default {
  createCode,
  verifyCode,
  isVerified,
};
