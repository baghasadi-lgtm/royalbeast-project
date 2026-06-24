import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'royalbeast-dev-secret';

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const STAFF_ROLES = ['staff', 'kapster'];

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

export const requireStaff = requireRole('owner', ...STAFF_ROLES);

export { JWT_SECRET };
