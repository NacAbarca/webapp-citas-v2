import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
  const token =
    req.cookies?.token ??
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ ok: false, error: { message: 'No autorizado' } });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ ok: false, error: { message: 'Token inválido o expirado' } });
  }
}

/**
 * requireRole('admin') or requireRole('admin', 'staff')
 * Returns array of middlewares [verifyToken, roleCheck]
 */
export function requireRole(...roles) {
  return [
    verifyToken,
    (req, res, next) => {
      if (!roles.flat().includes(req.user?.role)) {
        return res.status(403).json({ ok: false, error: { message: 'Prohibido' } });
      }
      next();
    },
  ];
}
