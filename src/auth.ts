import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { getUser, getUserById, createUser, getScanCount, updateScanCount } from './sqlite.js';

const JWT_SECRET = process.env.JWT_SECRET || 'threatradar-dev-secret-change-in-prod';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; plan: string };
}

export function generateToken(user: { id: string; email: string; plan: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET) as any;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function registerUser(email: string, password: string, plan = 'free') {
  if (getUser(email)) throw new Error('Email already registered');
  const hash = await bcrypt.hash(password, 10);
  const id = Date.now().toString();
  createUser(id, email, hash, plan);
  return { id, email, plan };
}

export async function loginUser(email: string, password: string) {
  const user = getUser(email);
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  return { id: user.id, email: user.email, plan: user.plan };
}

export function getPlanLimits(plan: string) {
  const limits: any = {
    free:       { scansPerMonth: 10,  sources: ['shodan', 'abuseipdb'] },
    pro:        { scansPerMonth: -1,  sources: ['shodan', 'abuseipdb', 'virustotal', 'hunter'] },
    enterprise: { scansPerMonth: -1,  sources: ['shodan', 'abuseipdb', 'virustotal', 'hunter', 'all'] }
  };
  return limits[plan] || limits['free'];
}

export function planMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const user = getUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const limits = getPlanLimits(user.plan);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const scanCount = getScanCount(user.id);

  if (!scanCount[monthKey]) scanCount[monthKey] = 0;

  if (limits.scansPerMonth !== -1 && scanCount[monthKey] >= limits.scansPerMonth) {
    return res.status(429).json({
      error: `Scan limit reached for your ${user.plan} plan (${limits.scansPerMonth}/month). Upgrade to Pro.`,
      upgrade: true
    });
  }

  scanCount[monthKey]++;
  updateScanCount(user.id, scanCount);
  req.user = { ...req.user!, plan: user.plan };
  (req as any).planLimits = limits;
  next();
}
