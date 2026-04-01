import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: IS_PROD ? 'none' : 'lax',
  maxAge:   24 * 60 * 60 * 1000, // 24h
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const email    = String(req.body?.email    ?? '').toLowerCase().trim();
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    return res.status(422).json({ ok: false, error: { message: 'Faltan credenciales' } });
  }

  const ip = req.ip;
  const ua = (req.headers['user-agent'] ?? '').slice(0, 255);

  const [rows] = await db.execute(
    'SELECT id, name, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  const user = rows[0];

  if (!user) {
    await db.execute(
      'INSERT INTO login_logs (user_id, email, ip, user_agent, success) VALUES (NULL, ?, ?, ?, 0)',
      [email, ip, ua]
    );
    return res.status(401).json({ ok: false, error: { message: 'Credenciales inválidas' } });
  }

  if (user.status !== 'active') {
    await db.execute(
      'INSERT INTO login_logs (user_id, email, ip, user_agent, success) VALUES (?, ?, ?, ?, 0)',
      [user.id, email, ip, ua]
    );
    return res.status(403).json({ ok: false, error: { message: 'Usuario inactivo' } });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    await db.execute(
      'INSERT INTO login_logs (user_id, email, ip, user_agent, success) VALUES (?, ?, ?, ?, 0)',
      [user.id, email, ip, ua]
    );
    return res.status(401).json({ ok: false, error: { message: 'Credenciales inválidas' } });
  }

  await db.execute(
    'INSERT INTO login_logs (user_id, email, ip, user_agent, success) VALUES (?, ?, ?, ?, 1)',
    [user.id, email, ip, ua]
  );

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

  res.cookie('token', token, COOKIE_OPTS);
  res.json({ ok: true, data: { user: payload } });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ ok: true, data: { user: { id, name, email, role } } });
});

// PUT /api/auth/me — change own password
router.put('/me', verifyToken, async (req, res) => {
  const current_password = String(req.body?.current_password ?? '');
  const new_password     = String(req.body?.new_password     ?? '');

  if (!current_password || !new_password) {
    return res.status(422).json({ ok: false, error: { message: 'current_password y new_password son requeridos' } });
  }
  if (new_password.length < 8) {
    return res.status(422).json({ ok: false, error: { message: 'La nueva contraseña debe tener al menos 8 caracteres' } });
  }

  const [rows] = await db.execute(
    'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
    [req.user.id]
  );
  const user = rows[0];
  if (!user) {
    return res.status(404).json({ ok: false, error: { message: 'Usuario no encontrado' } });
  }

  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ ok: false, error: { message: 'Contraseña actual incorrecta' } });
  }

  const hash = await bcrypt.hash(new_password, 12);
  await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

  res.json({ ok: true, data: { updated: true } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ ok: true, data: true });
});

export default router;
