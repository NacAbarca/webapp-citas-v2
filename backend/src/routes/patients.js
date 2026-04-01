import { Router } from 'express';
import db from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { parseDMY } from '../utils/dates.js';

const router     = Router();
const STAFF_ADMIN = requireRole('admin', 'staff');

const normStr = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

// GET /api/patients
router.get('/', STAFF_ADMIN, async (req, res) => {
  const where  = [];
  const params = [];

  if (req.query.vigente !== undefined) {
    where.push('vigente = ?');
    params.push(Number(req.query.vigente));
  }

  const sql = `SELECT * FROM pacientes${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY nombres ASC`;
  const [patients] = await db.execute(sql, params);
  res.json({ ok: true, data: { patients } });
});

// POST /api/patients
router.post('/', STAFF_ADMIN, async (req, res) => {
  const body        = req.body ?? {};
  const id_paciente = normStr(body.id_paciente);
  const nombres     = String(body.nombres ?? '').trim();

  if (!id_paciente) return res.status(422).json({ ok: false, error: { message: 'id_paciente es obligatorio' } });
  if (!nombres)     return res.status(422).json({ ok: false, error: { message: 'nombres es obligatorio' } });

  const [exist] = await db.execute('SELECT 1 FROM pacientes WHERE id_paciente = ? LIMIT 1', [id_paciente]);
  if (exist.length) return res.status(409).json({ ok: false, error: { message: 'id_paciente ya existe' } });

  await db.execute(`
    INSERT INTO pacientes
      (id_paciente, usuario, nombres, apellido_paterno, apellido_materno,
       fecha_nacimiento, edad, porcentaje_discapacidad, condiciones, nacionalidad,
       genero, establecimiento, ampersand_flag, contacto, email,
       direccion, comuna, region, provincia, vigente, sector, foto, observaciones)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id_paciente,
    normStr(body.usuario),
    nombres,
    normStr(body.apellido_paterno),
    normStr(body.apellido_materno),
    parseDMY(body.fecha_nacimiento),
    body.edad                    != null ? Number(body.edad)                    : null,
    body.porcentaje_discapacidad != null ? Number(body.porcentaje_discapacidad) : 0,
    normStr(body.condiciones),
    normStr(body.nacionalidad),
    normStr(body.genero),
    normStr(body.establecimiento),
    body.ampersand_flag ? 1 : 0,
    normStr(body.contacto),
    normStr(body.email),
    normStr(body.direccion),
    normStr(body.comuna),
    normStr(body.region),
    normStr(body.provincia),
    body.vigente != null ? Number(body.vigente) : 1,
    normStr(body.sector) ?? 'Sin informado',
    normStr(body.foto),
    normStr(body.observaciones),
  ]);

  res.json({ ok: true, data: { id_paciente } });
});

// PUT /api/patients/:id_paciente
router.put('/:id_paciente', STAFF_ADMIN, async (req, res) => {
  const { id_paciente } = req.params;
  if (!id_paciente) return res.status(422).json({ ok: false, error: { message: 'Falta id_paciente' } });

  const body = req.body ?? {};

  await db.execute(`
    UPDATE pacientes SET
      usuario = ?, nombres = ?, apellido_paterno = ?, apellido_materno = ?,
      fecha_nacimiento = ?, edad = ?, porcentaje_discapacidad = ?,
      condiciones = ?, nacionalidad = ?, genero = ?, establecimiento = ?,
      ampersand_flag = ?, contacto = ?, email = ?,
      direccion = ?, comuna = ?, region = ?, provincia = ?,
      vigente = ?, sector = ?, foto = ?, observaciones = ?
    WHERE id_paciente = ?
  `, [
    normStr(body.usuario),
    String(body.nombres ?? '').trim() || null,
    normStr(body.apellido_paterno),
    normStr(body.apellido_materno),
    parseDMY(body.fecha_nacimiento),
    body.edad                    != null ? Number(body.edad)                    : null,
    body.porcentaje_discapacidad != null ? Number(body.porcentaje_discapacidad) : 0,
    normStr(body.condiciones),
    normStr(body.nacionalidad),
    normStr(body.genero),
    normStr(body.establecimiento),
    body.ampersand_flag ? 1 : 0,
    normStr(body.contacto),
    normStr(body.email),
    normStr(body.direccion),
    normStr(body.comuna),
    normStr(body.region),
    normStr(body.provincia),
    body.vigente != null ? Number(body.vigente) : 1,
    normStr(body.sector) ?? 'Sin informado',
    normStr(body.foto),
    normStr(body.observaciones),
    id_paciente,
  ]);

  res.json({ ok: true, data: { id_paciente } });
});

export default router;
