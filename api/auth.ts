import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * POST /api/auth  { phone, nationalId }
 *  - username = mobile number, password = national ID
 *  - only accounts imported by the admin (/api/users) can log in; there is no self-registration
 *  - the national ID is only stored as a salted scrypt hash
 *  - 5 failed attempts lock the account for 15 minutes
 * Returns { token, phone, fullName, latest } where `latest` is the user's most recent completed session (or null).
 *
 * Required env: DATABASE_URL (or POSTGRES_URL). Optional: SESSION_SECRET.
 */

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = connectionString ? neon(connectionString) : null;

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

let tablesReady: Promise<unknown> | null = null;
function ensureTables() {
  if (!sql) throw new Error('DATABASE_URL is not configured');
  if (!tablesReady) {
    tablesReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS naghshnama_users (
          phone           TEXT PRIMARY KEY,
          nid_hash        TEXT NOT NULL,
          full_name       TEXT,
          failed_attempts INTEGER NOT NULL DEFAULT 0,
          locked_until    TIMESTAMPTZ,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_login_at   TIMESTAMPTZ
        )
      `;
      await sql`ALTER TABLE naghshnama_users ADD COLUMN IF NOT EXISTS full_name TEXT`;
      await sql`
        CREATE TABLE IF NOT EXISTS naghshnama_sessions (
          session_id  TEXT PRIMARY KEY,
          phone       TEXT NOT NULL,
          data        JSONB NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS naghshnama_sessions_phone_idx ON naghshnama_sessions (phone, created_at DESC)`;
    })().catch((err) => {
      tablesReady = null;
      throw err;
    });
  }
  return tablesReady;
}

function secret() {
  return process.env.SESSION_SECRET || createHash('sha256').update('naghshnama:' + (connectionString || '')).digest('hex');
}

function signToken(phone: string) {
  const payload = Buffer.from(`${phone}.${Date.now() + TOKEN_TTL_MS}`).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

const DIGITS: Record<string, string> = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
const normDigits = (s: string) => s.replace(/[۰-۹٠-٩]/g, (c) => DIGITS[c] || c).replace(/[\s-]/g, '');

function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let p = normDigits(raw);
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (/^9\d{9}$/.test(p)) p = '0' + p;
  return /^09\d{9}$/.test(p) ? p : null;
}

function normalizeNationalId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const id = normDigits(raw);
  if (!/^\d{10}$/.test(id) || /^(\d)\1{9}$/.test(id)) return null;
  const check = +id[9];
  const sum = id.slice(0, 9).split('').reduce((acc, d, i) => acc + +d * (10 - i), 0) % 11;
  return (sum < 2 ? check === sum : check === 11 - sum) ? id : null;
}

function hashNid(nid: string, saltHex = randomBytes(16).toString('hex')) {
  return `${saltHex}:${scryptSync(nid, Buffer.from(saltHex, 'hex'), 32).toString('hex')}`;
}

const DUMMY_HASH = hashNid('0000000000');

function verifyNid(nid: string, stored: string) {
  const [salt, hash] = stored.split(':');
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(nid, Buffer.from(salt, 'hex'), 32);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const phone = normalizePhone(req.body?.phone);
  const nid = normalizeNationalId(req.body?.nationalId);
  if (!phone) return res.status(400).json({ error: 'invalid_phone' });
  if (!nid) return res.status(400).json({ error: 'invalid_national_id' });

  try {
    await ensureTables();
    const rows = await sql!`SELECT nid_hash, full_name, failed_attempts, locked_until FROM naghshnama_users WHERE phone = ${phone}`;

    if (rows.length === 0) {
      // Unknown phone: do the same amount of work as a real check and answer exactly like a wrong password.
      verifyNid(nid, DUMMY_HASH);
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const user: any = rows[0];
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return res.status(429).json({ error: 'locked' });
    }
    if (!verifyNid(nid, user.nid_hash)) {
      const failed = (user.failed_attempts || 0) + 1;
      if (failed >= MAX_FAILED) {
        await sql!`UPDATE naghshnama_users SET failed_attempts = 0, locked_until = now() + make_interval(mins => ${LOCK_MINUTES}) WHERE phone = ${phone}`;
        return res.status(429).json({ error: 'locked' });
      }
      await sql!`UPDATE naghshnama_users SET failed_attempts = ${failed} WHERE phone = ${phone}`;
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    await sql!`UPDATE naghshnama_users SET failed_attempts = 0, locked_until = NULL, last_login_at = now() WHERE phone = ${phone}`;

    const latest = await sql!`SELECT data FROM naghshnama_sessions WHERE phone = ${phone} ORDER BY created_at DESC LIMIT 1`;
    return res.status(200).json({ token: signToken(phone), phone, fullName: user.full_name || null, latest: latest.length ? (latest[0] as any).data : null });
  } catch (err) {
    console.error('auth api error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
