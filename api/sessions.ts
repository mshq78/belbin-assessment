import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * POST /api/sessions  — logged-in participant (Authorization: Bearer <token> from /api/auth) submits a
 *                        completed session (upsert by sessionId; the phone comes from the token)
 * GET  /api/sessions  — admin only: header `x-admin-password` must match env ADMIN_PASSWORD
 *
 * Required env: DATABASE_URL (or POSTGRES_URL), ADMIN_PASSWORD. Optional: SESSION_SECRET
 */

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = connectionString ? neon(connectionString) : null;

let tableReady: Promise<unknown> | null = null;
function ensureTable() {
  if (!sql) throw new Error('DATABASE_URL is not configured');
  if (!tableReady) {
    tableReady = (async () => {
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
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

function sessionSecret() {
  return process.env.SESSION_SECRET || createHash('sha256').update('naghshnama:' + (connectionString || '')).digest('hex');
}

/** Returns the phone number for a valid, unexpired token from /api/auth, else null. */
function phoneFromToken(req: VercelRequest): string | null {
  const header = req.headers['authorization'];
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  const [payload, sig] = header.slice(7).split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [phone, exp] = Buffer.from(payload, 'base64url').toString().split('.');
  if (!phone || !(Number(exp) > Date.now())) return null;
  return phone;
}

function digest(value: string) {
  return createHash('sha256').update(value).digest();
}

function isAdmin(req: VercelRequest): boolean | 'unconfigured' {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return 'unconfigured';
  const given = req.headers['x-admin-password'];
  if (typeof given !== 'string' || !given) return false;
  return timingSafeEqual(digest(given), digest(expected));
}

function isValidSession(body: any): boolean {
  return (
    body &&
    typeof body === 'object' &&
    typeof body.sessionId === 'string' &&
    /^[A-Za-z0-9_-]{3,80}$/.test(body.sessionId) &&
    typeof body.finishedAt === 'string' &&
    Array.isArray(body.responsesA) &&
    body.responsesA.length <= 18 &&
    Array.isArray(body.responsesB) &&
    body.responsesB.length <= 9 &&
    Array.isArray(body.responsesC) &&
    body.responsesC.length <= 3 &&
    body.scoring &&
    typeof body.scoring === 'object' &&
    body.rqi &&
    typeof body.rqi === 'object'
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'POST') {
      const phone = phoneFromToken(req);
      if (!phone) return res.status(401).json({ error: 'unauthorized' });
      if (!isValidSession(req.body)) {
        return res.status(400).json({ error: 'invalid_session' });
      }
      await ensureTable();
      const session = { ...req.body, participantProfile: { ...(req.body.participantProfile || {}), mobile: phone } };
      await sql!`
        INSERT INTO naghshnama_sessions (session_id, phone, data)
        VALUES (${session.sessionId}, ${phone}, ${JSON.stringify(session)}::jsonb)
        ON CONFLICT (session_id)
        DO UPDATE SET data = EXCLUDED.data, updated_at = now()
        WHERE naghshnama_sessions.phone = EXCLUDED.phone
      `;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const auth = isAdmin(req);
      if (auth === 'unconfigured') return res.status(503).json({ error: 'admin_password_not_configured' });
      if (!auth) return res.status(401).json({ error: 'unauthorized' });
      await ensureTable();
      const rows = await sql!`
        SELECT data FROM naghshnama_sessions ORDER BY created_at DESC LIMIT 5000
      `;
      return res.status(200).json({ sessions: rows.map((r: any) => r.data) });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    console.error('sessions api error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
