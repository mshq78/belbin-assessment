import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * POST /api/sessions  — public: a participant submits a completed session (upsert by sessionId)
 * GET  /api/sessions  — admin only: header `x-admin-password` must match env ADMIN_PASSWORD
 *
 * Required env: DATABASE_URL (or POSTGRES_URL), ADMIN_PASSWORD
 */

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = connectionString ? neon(connectionString) : null;

let tableReady: Promise<unknown> | null = null;
function ensureTable() {
  if (!sql) throw new Error('DATABASE_URL is not configured');
  if (!tableReady) {
    tableReady = sql`
      CREATE TABLE IF NOT EXISTS belbin_sessions (
        session_id  TEXT PRIMARY KEY,
        data        JSONB NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `.catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
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
      if (!isValidSession(req.body)) {
        return res.status(400).json({ error: 'invalid_session' });
      }
      await ensureTable();
      const session = req.body;
      await sql!`
        INSERT INTO belbin_sessions (session_id, data)
        VALUES (${session.sessionId}, ${JSON.stringify(session)}::jsonb)
        ON CONFLICT (session_id)
        DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      `;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const auth = isAdmin(req);
      if (auth === 'unconfigured') return res.status(503).json({ error: 'admin_password_not_configured' });
      if (!auth) return res.status(401).json({ error: 'unauthorized' });
      await ensureTable();
      const rows = await sql!`
        SELECT data FROM belbin_sessions ORDER BY created_at DESC LIMIT 5000
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
