import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await db.execute('SELECT 1');
    res.json({ ok: true, data: { status: 'up', db: 'ok' } });
  } catch (err) {
    res.status(503).json({ ok: false, error: { message: 'DB error', details: err.message } });
  }
});

export default router;
