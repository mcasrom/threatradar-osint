import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { readDB, writeDB } from './db.js';

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
  const db = readDB();
  if (!db.users) db.users = [];
  if (db.users.find((u: any) => u.email === email)) {
    throw new Error('Email already registered');
  }
  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), email, password: hash, plan, createdAt: new Date().toISOString() };
  db.users.push(user);
  writeDB(db);
  return { id: user.id, email: user.email, plan: user.plan };
}

export async function loginUser(email: string, password: string) {
  const db = readDB();
  if (!db.users) throw new Error('No users found');
  const user = db.users.find((u: any) => u.email === email);
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  return { id: user.id, email: user.email, plan: user.plan };
}
