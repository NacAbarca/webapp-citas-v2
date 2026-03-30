import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router     = Router();
const ADMIN_ONLY = requireRole('admin');

const VALID_ROLES    = ['admin', 'staff', 'user', 'interpreter'];
const VALID_STATUSES = ['active', 'inactive'];

// GET /api/users
router.get('/', ADMIN_ONLY, async (req, res) => {
  const [users] = await db.execute(
    'SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ ok: true, data: { users } });
});

// POST /api/users
router.post('/', ADMIN_ONLY, async (req, res) => {
  const { name, email, password, role = 'user', status = 'active' } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(422).json({ ok: false, error: { message: 'name, email y password son requeridos' } });
  }
  if (!VALID_ROLES.includes(role) || !VALID_STATUSES.includes(status)) {
    return res.status(422).json({ ok: false, error: { message: 'role o status inválido' } });
  }

  const [exist] = await db.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email.toLowerCase().trim()]
  );
  if (exist.length) {
    return res.status(409).json({ ok: false, error: { message: 'Email ya existe' } });
  }

  const hash     = await bcrypt.hash(password, 12);
  const [result] = await db.execute(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), email.toLowerCase().trim(), hash, role, status]
  );
  res.json({ ok: true, data: { id: result.insertId } });
});

// PUT /api/users/:id
router.put('/:id', ADMIN_ONLY, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(422).json({ ok: false, error: { message: 'id inválido' } });

  const { name, role, status, password } = req.body ?? {};
  const sets = [];
  const vals = [];

  if (name)     { sets.push('name = ?');         vals.push(name.trim()); }
  if (role)     { sets.push('role = ?');          vals.push(role); }
  if (status)   { sets.push('status = ?');        vals.push(status); }
  if (password) { sets.push('password_hash = ?'); vals.push(await bcrypt.hash(password, 12)); }

  if (!sets.length) {
    return res.status(422).json({ ok: false, error: { message: 'Sin campos para actualizar' } });
  }

  vals.push(id);
  await db.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
  res.json({ ok: true, data: { id } });
});

// DELETE /api/users/:id  (soft delete → status = inactive)
router.delete('/:id', ADMIN_ONLY, async (req, res) => {
  const id     = Number(req.params.id);
  const selfId = req.user.id;

  if (!id) return res.status(422).json({ ok: false, error: { message: 'id inválido' } });
  if (id === selfId) {
    return res.status(400).json({ ok: false, error: { message: 'No puedes eliminarte a ti mismo' } });
  }

  await db.execute("UPDATE users SET status = 'inactive' WHERE id = ?", [id]);
  res.json({ ok: true, data: { id } });
});

export default router;
