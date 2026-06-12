/**
 * Shared auth utilities — JWT token handling, password hashing.
 * Zero external dependencies, uses only Node.js built-in crypto.
 */
import crypto from 'crypto';

const SECRET = process.env.ADMIN_SECRET || 'menukits-dev-secret-change-me';

/** Deterministic salt for a given username */
export function deriveSalt(username) {
  return crypto
    .createHmac('sha256', SECRET)
    .update('salt:' + username)
    .digest('hex')
    .slice(0, 16);
}

/** Hash password with SHA-256(salt:password) */
export function hashPassword(password, salt) {
  return crypto
    .createHash('sha256')
    .update(salt + ':' + password)
    .digest('hex');
}

/** Generate a random user ID */
export function generateUserId() {
  return 'u_' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

/**
 * Create a signed JWT token.
 * Payload: { sub, username, displayName, iat, exp }
 */
export function createToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    sub: payload.sub,
    username: payload.username,
    displayName: payload.displayName,
    iat: now,
    exp: now + 7 * 24 * 3600,
  };

  const headerB64 = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadB64 = toBase64Url(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(headerB64 + '.' + payloadB64)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verify and decode a JWT token.
 * Returns the payload or null if invalid/expired.
 */
export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const headerB64 = parts[0];
    const payloadB64 = parts[1];
    const sigB64 = parts[2];

    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(headerB64 + '.' + payloadB64)
      .digest('base64url');

    if (sigB64 !== expectedSig) return null;

    const payload = JSON.parse(fromBase64Url(payloadB64));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function toBase64Url(str) {
  return Buffer.from(str).toString('base64url');
}

function fromBase64Url(str) {
  return Buffer.from(str, 'base64url').toString('utf-8');
}
