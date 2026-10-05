import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/**
 * Admin-only user management (header `x-admin-password` must equal env ADMIN_PASSWORD).
 *
 * GET    /api/users                  -> { users: [{ phone, fullName, createdAt, lastLoginAt, sessions }] }
 * POST   /api/users { users: [...] } -> import / update accounts (max 100 per request)
 *          each user: { fullName, phone, nationalId }  (existing phone => name + national ID are replaced)
 *          -> { created, updated, errors: [{ index, reason }] }
 * DELETE /api/users?phone=09...      -> remove an account (completed sessions are kept)
 *
 * Users are the only accounts that can log in (/api/auth). National IDs are stored as salted scrypt hashes.
 */

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = connectionString ? neon(connectionString) : null;
const MAX_BATCH = 100;

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
    })().catch((err) => {
      tablesReady = null;
      throw err;
    });
  }
  return tablesReady;
}

const digest = (v: string) => createHash('sha256').update(v).digest();

function isAdmin(req: VercelRequest): boolean | 'unconfigured' {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return 'unconfigured';
  const given = req.headers['x-admin-password'];
  if (typeof given !== 'string' || !given) return false;
  return timingSafeEqual(digest(given), digest(expected));
}

const DIGITS: Record<string, string> = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
const normDigits = (s: string) => s.replace(/[۰-۹٠-٩]/g, (c) => DIGITS[c] || c).replace(/[\s-]/g, '');

function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  let p = normDigits(String(raw));
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (/^9\d{9}$/.test(p)) p = '0' + p;
  return /^09\d{9}$/.test(p) ? p : null;
}

function normalizeNationalId(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  let id = normDigits(String(raw));
  if (/^\d{8,9}$/.test(id)) id = id.padStart(10, '0'); // Excel drops leading zeros
  if (!/^\d{10}$/.test(id) || /^(\d)\1{9}$/.test(id)) return null;
  const check = +id[9];
  const sum = id.slice(0, 9).split('').reduce((acc, d, i) => acc + +d * (10 - i), 0) % 11;
  return (sum < 2 ? check === sum : check === 11 - sum) ? id : null;
}

function hashNid(nid: string): Promise<string> {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) =>
    scrypt(nid, salt, 32, (err, key) => (err ? reject(err) : resolve(`${salt.toString('hex')}:${key.toString('hex')}`)))
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const auth = isAdmin(req);
  if (auth === 'unconfigured') return res.status(503).json({ error: 'admin_password_not_configured' });
  if (!auth) return res.status(401).json({ error: 'unauthorized' });

  try {
    await ensureTables();

    if (req.method === 'GET') {
      const rows = await sql!`
        SELECT u.phone, u.full_name, u.created_at, u.last_login_at,
               (SELECT count(*)::int FROM naghshnama_sessions s WHERE s.phone = u.phone) AS sessions
        FROM naghshnama_users u
        ORDER BY u.created_at DESC
        LIMIT 20000
      `;
      return res.status(200).json({
        users: rows.map((r: any) => ({
          phone: r.phone,
          fullName: r.full_name,
          createdAt: r.created_at,
          lastLoginAt: r.last_login_at,
          sessions: r.sessions,
        })),
      });
    }

    if (req.method === 'POST') {
      const input = req.body?.users;
      if (!Array.isArray(input) || input.length === 0 || input.length > MAX_BATCH) {
        return res.status(400).json({ error: 'invalid_batch' });
      }
      const errors: { index: number; reason: string }[] = [];
      const seen = new Set<string>();
      const valid: { phone: string; nid: string; fullName: string }[] = [];

      input.forEach((u: any, index: number) => {
        const phone = normalizePhone(u?.phone);
        const nid = normalizeNationalId(u?.nationalId);
        const fullName = typeof u?.fullName === 'string' ? u.fullName.trim().slice(0, 120) : '';
        if (!phone) return errors.push({ index, reason: 'invalid_phone' });
        if (!nid) return errors.push({ index, reason: 'invalid_national_id' });
        if (seen.has(phone)) return errors.push({ index, reason: 'duplicate_in_batch' });
        seen.add(phone);
        valid.push({ phone, nid, fullName });
      });

      let created = 0;
      let updated = 0;
      const hashes = await Promise.all(valid.map((v) => hashNid(v.nid)));
      for (let i = 0; i < valid.length; i++) {
        const { phone, fullName } = valid[i];
        const rows = await sql!`
          INSERT INTO naghshnama_users (phone, nid_hash, full_name)
          VALUES (${phone}, ${hashes[i]}, ${fullName || null})
          ON CONFLICT (phone) DO UPDATE
            SET nid_hash = EXCLUDED.nid_hash,
                full_name = COALESCE(EXCLUDED.full_name, naghshnama_users.full_name),
                failed_attempts = 0,
                locked_until = NULL
          RETURNING (xmax = 0) AS inserted
        `;
        if ((rows[0] as any).inserted) created++;
        else updated++;
      }
      return res.status(200).json({ created, updated, errors });
    }

    if (req.method === 'DELETE') {
      const phone = normalizePhone(req.query.phone);
      if (!phone) return res.status(400).json({ error: 'invalid_phone' });
      await sql!`DELETE FROM naghshnama_users WHERE phone = ${phone}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    console.error('users api error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
