import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { parseDMY, parseTime } from '../utils/dates.js';

const router     = Router();
const STAFF_ADMIN = ['admin', 'staff'];

const canManageAll = (role) => STAFF_ADMIN.includes(role);

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'no_show', 'done'];

/** Normaliza "YYYY-MM-DD HH:MM:SS", "YYYY-MM-DDTHH:MM", "DD-MM-YYYY HH:MM" → "YYYY-MM-DD HH:MM:SS" */
function parseDt(raw) {
  const s = String(raw ?? '').trim();

  // YYYY-MM-DD HH:MM:SS  |  YYYY-MM-DDTHH:MM
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6] ?? '00'}`;

  // DD-MM-YYYY HH:MM
  m = s.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}:${m[6] ?? '00'}`;

  return null;
}

function assertDt(raw, field) {
  const dt = parseDt(raw);
  if (!dt) throw Object.assign(new Error(`${field}: formato de fecha inválido`), { status: 422 });
  return dt;
}

// GET /api/appointments
router.get('/', verifyToken, async (req, res) => {
  const { role, id: meId } = req.user;
  const { from, to }       = req.query;

  let sql = `
    SELECT
      a.*,
      u.name  AS user_name,
      u.email AS user_email,
      p.id_paciente        AS paciente_rut,
      p.nombres            AS paciente_nombres,
      p.apellido_paterno,
      p.apellido_materno
    FROM appointments a
    JOIN  users    u ON a.user_id     = u.id
    LEFT JOIN pacientes p ON a.id_paciente = p.id_paciente
  `;
  const params = [];
  const where  = [];

  if (!canManageAll(role)) { where.push('a.user_id = ?'); params.push(meId); }
  if (from)                { where.push('a.start_at >= ?'); params.push(from); }
  if (to)                  { where.push('a.start_at <= ?'); params.push(to); }

  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY a.start_at ASC';

  const [appointments] = await db.execute(sql, params);
  res.json({ ok: true, data: { appointments } });
});

// POST /api/appointments
router.post('/', verifyToken, async (req, res) => {
  const { role, id: meId } = req.user;
  const body = req.body ?? {};

  const user_id     = body.user_id    != null ? Number(body.user_id)  : meId;
  const staff_id    = body.staff_id   != null ? Number(body.staff_id) : null;
  const id_paciente = (body.id_paciente != null && body.id_paciente !== '')
    ? String(body.id_paciente).trim() : null;

  const start_at = assertDt(body.start_at, 'start_at');
  const end_at   = assertDt(body.end_at,   'end_at');

  if (new Date(end_at) <= new Date(start_at)) {
    return res.status(422).json({ ok: false, error: { message: 'start_at debe ser antes que end_at' } });
  }

  const notes          = body.notes         ?? null;
  const attention_type = body.attention_type ? String(body.attention_type).trim() : null;
  const sector_at      = body.sector_at      ? String(body.sector_at).trim()      : null;
  const interpreter_id = body.interpreter_id ? Number(body.interpreter_id)        : null;

  if (!canManageAll(role) && (attention_type || sector_at || interpreter_id)) {
    return res.status(403).json({ ok: false, error: { message: 'Solo staff/admin puede asignar atención/intérprete' } });
  }

  if (interpreter_id) {
    const [rows] = await db.execute('SELECT status FROM users WHERE id = ? LIMIT 1', [interpreter_id]);
    if (!rows[0])                   return res.status(404).json({ ok: false, error: { message: 'Intérprete no existe' } });
    if (rows[0].status !== 'active') return res.status(422).json({ ok: false, error: { message: 'Intérprete inactivo' } });
  }

  const created_by_staff_id = canManageAll(role) ? meId : null;

  const [result] = await db.execute(`
    INSERT INTO appointments
      (user_id, staff_id, id_paciente, start_at, end_at, status, notes,
       attention_type, sector_at, interpreter_id, created_by_staff_id)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
  `, [user_id, staff_id, id_paciente, start_at, end_at, notes,
      attention_type, sector_at, interpreter_id, created_by_staff_id]);

  res.json({ ok: true, data: { id: result.insertId } });
});

// PUT /api/appointments/:id
router.put('/:id', verifyToken, async (req, res) => {
  const id   = Number(req.params.id);
  const { role, id: meId } = req.user;
  const body = req.body ?? {};

  if (!id) return res.status(422).json({ ok: false, error: { message: 'id inválido' } });

  const [rows] = await db.execute('SELECT user_id FROM appointments WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return res.status(404).json({ ok: false, error: { message: 'Cita no existe' } });
  if (!canManageAll(role) && rows[0].user_id !== meId) {
    return res.status(403).json({ ok: false, error: { message: 'Prohibido' } });
  }

  const sets = [];
  const vals = [];

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return res.status(422).json({ ok: false, error: { message: 'status inválido' } });
    }
    sets.push('status = ?'); vals.push(body.status);
  }
  if (body.notes !== undefined) { sets.push('notes = ?'); vals.push(body.notes); }

  if (canManageAll(role)) {
    if (body.attention_type !== undefined) { sets.push('attention_type = ?');  vals.push(body.attention_type); }
    if (body.sector_at      !== undefined) { sets.push('sector_at = ?');       vals.push(body.sector_at); }
    if (body.interpreter_id !== undefined) { sets.push('interpreter_id = ?');  vals.push(body.interpreter_id); }
  }

  if (!sets.length) {
    return res.status(422).json({ ok: false, error: { message: 'Sin campos para actualizar' } });
  }

  vals.push(id);
  await db.execute(`UPDATE appointments SET ${sets.join(', ')} WHERE id = ?`, vals);
  res.json({ ok: true, data: { id } });
});

// GET /api/appointments/:id/history
router.get('/:id/history', verifyToken, async (req, res) => {
  const id   = Number(req.params.id);
  const { role, id: meId } = req.user;

  if (!id) return res.status(422).json({ ok: false, error: { message: 'id requerido' } });

  const [rows] = await db.execute('SELECT user_id FROM appointments WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return res.status(404).json({ ok: false, error: { message: 'Cita no existe' } });

  if (!canManageAll(role) && rows[0].user_id !== meId) {
    return res.status(403).json({ ok: false, error: { message: 'Prohibido' } });
  }

  const [history] = await db.execute(`
    SELECT h.id, h.status, h.changed_by, h.changed_at, u.email AS changed_by_email
    FROM appointment_status_history h
    LEFT JOIN users u ON h.changed_by = u.id
    WHERE h.appointment_id = ?
    ORDER BY h.changed_at DESC
  `, [id]);

  res.json({ ok: true, data: { history } });
});

export default router;
