import { Router } from 'express';
import db from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/audit/login-logs  — admin only
router.get('/login-logs', requireRole('admin'), async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 50, 500));

    const [rows] = await db.query(
      `SELECT id, user_id, email, ip, user_agent, success, created_at
       FROM login_logs
       ORDER BY created_at DESC
       LIMIT ${limit}`
    );

    res.json({ ok: true, data: { logs: rows } });
  } catch (err) {
    console.error('Audit error:', err);
    res.status(500).json({ ok: false, error: { message: 'DB error', details: err.message } });
  }
});

export default router;
