import { Router } from 'express';
import db from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/audit/login-logs  — admin only
router.get('/login-logs', requireRole('admin'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500);

  const [logs] = await db.execute(
    `SELECT id, user_id, email, ip, user_agent, success, created_at
     FROM login_logs
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );

  res.json({ ok: true, data: { logs } });
});

export default router;
