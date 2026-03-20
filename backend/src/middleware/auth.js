import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies?.auth_token;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // token inválido, seguimos sin usuario
  }
  next();
}

export function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'No tenés permiso para esta acción.' });
      }
      next();
    },
  ];
}
