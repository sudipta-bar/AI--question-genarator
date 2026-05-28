import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Assignment } from '../models/Assignment.js';
import { GeneratedPaper } from '../models/GeneratedPaper.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { User } from '../models/User.js';
import { uploadProfileImageToCloudinary } from '../services/cloudinaryService.js';
import { sendPasswordResetEmail } from '../services/mailService.js';
import { AuthRequest } from '../types/index.js';

const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6), schoolName: z.string().optional(), city: z.string().optional() });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({ password: z.string().min(6) });
const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/\d/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol');
const changePasswordSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: strongPasswordSchema,
});

function signAccessToken(userId: string) {
  return jwt.sign({ userId, type: 'access' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(userId: string) {
  return jwt.sign({ userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function cookieOptions() {
  const isHttpsFrontend = env.FRONTEND_URL.startsWith('https://');
  return {
    httpOnly: true,
    secure: isHttpsFrontend,
    sameSite: isHttpsFrontend ? 'none' as const : 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function serializeUser(user: typeof User.prototype) {
  return { id: user._id.toString(), name: user.name, email: user.email, profileImage: user.profileImage, schoolName: user.schoolName, city: user.city, role: user.role, themePreference: user.themePreference ?? 'light' };
}

async function persistRefreshToken(req: Request, userId: string, token: string) {
  await RefreshToken.create({ userId, token: hashToken(token), userAgent: req.headers['user-agent'], ip: req.ip, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const existing = await User.findOne({ email: input.email.toLowerCase().trim() });
  if (existing) return res.status(409).json({ message: 'Email already registered' });
  const uploadedImage = req.file ? await uploadProfileImageToCloudinary(req.file) : null;
  const user = await User.create({ ...input, email: input.email.toLowerCase().trim(), profileImage: uploadedImage?.secureUrl, password: await bcrypt.hash(input.password, 12) });
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());
  await persistRefreshToken(req, user._id.toString(), refreshToken);
  res.cookie('refreshToken', refreshToken, cookieOptions());
  return res.status(201).json({ accessToken, user: serializeUser(user) });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email });
  if (!user || !(await bcrypt.compare(input.password, user.password))) return res.status(401).json({ message: 'Invalid email or password' });
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());
  await persistRefreshToken(req, user._id.toString(), refreshToken);
  res.cookie('refreshToken', refreshToken, cookieOptions());
  return res.json({ accessToken, user: serializeUser(user) });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) return res.status(401).json({ message: 'Missing refresh token' });
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; type: string };
    if (payload.type !== 'refresh') return res.status(401).json({ message: 'Invalid token type' });
    const hashed = hashToken(token);
    const stored = await RefreshToken.findOne({ token: hashed });
    if (!stored) return res.status(401).json({ message: 'Refresh token not found' });
    if (stored.expiresAt.getTime() < Date.now()) {
      await stored.deleteOne();
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    await stored.deleteOne();
    const accessToken = signAccessToken(payload.userId);
    const refreshToken = signRefreshToken(payload.userId);
    await persistRefreshToken(req, payload.userId, refreshToken);
    res.cookie('refreshToken', refreshToken, cookieOptions());
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined;
  if (token) await RefreshToken.deleteOne({ token: hashToken(token) });
  res.clearCookie('refreshToken');
  return res.json({ message: 'Logged out' });
}

export async function forgotPassword(req: Request, res: Response) {
  const input = forgotPasswordSchema.parse(req.body);
  const user = await User.findOne({ email: input.email });
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = hashToken(rawToken);
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const resetUrl = `${env.FRONTEND_URL}/reset-password/${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
  return res.json({ message: 'If that email exists, a reset link has been sent.', resetUrl: env.NODE_ENV === 'production' ? undefined : resetUrl });
}

export async function resetPassword(req: Request, res: Response) {
  const input = resetPasswordSchema.parse(req.body);
  const token = hashToken(req.params.token);
  const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' });

  user.password = await bcrypt.hash(input.password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  await RefreshToken.deleteMany({ userId: user._id });

  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());
  await persistRefreshToken(req, user._id.toString(), refreshToken);
  res.cookie('refreshToken', refreshToken, cookieOptions());
  return res.json({ message: 'Password updated successfully', accessToken, user: serializeUser(user) });
}

export async function changePassword(req: Request, res: Response) {
  const input = changePasswordSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase().trim() });
  if (!user) return res.status(404).json({ message: 'No account exists for that email address' });

  const currentMatches = await bcrypt.compare(input.currentPassword, user.password);
  if (!currentMatches) return res.status(401).json({ message: 'Current password is incorrect' });

  const samePassword = await bcrypt.compare(input.newPassword, user.password);
  if (samePassword) return res.status(400).json({ message: 'New password must be different from your current password' });

  user.password = await bcrypt.hash(input.newPassword, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  await RefreshToken.deleteMany({ userId: user._id });

  return res.json({ message: 'Password changed successfully. Please sign in with your new password.' });
}

async function getUserIdFromRequest(req: Request) {
  const header = req.headers.authorization;
  const accessToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (accessToken) {
    const payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as { userId: string; type: string };
    if (payload.type === 'access') return payload.userId;
  }

  const refreshToken = req.cookies?.refreshToken as string | undefined;
  if (!refreshToken) return null;
  const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; type: string };
  if (payload.type !== 'refresh') return null;
  const stored = await RefreshToken.findOne({ token: hashToken(refreshToken) });
  if (!stored || stored.expiresAt.getTime() < Date.now()) return null;
  return payload.userId;
}

export async function me(req: Request, res: Response) {
  let userId: string | null = null;
  try {
    userId = await getUserIdFromRequest(req);
  } catch {
    userId = null;
  }
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const user = await User.findById(userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: serializeUser(user), accessToken: signAccessToken(user._id.toString()) });
}

export async function updateMe(req: AuthRequest, res: Response) {
  const input = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    schoolName: z.string().optional(),
    city: z.string().optional(),
    themePreference: z.enum(['light', 'dark']).optional(),
  }).parse(req.body);

  if (input.email) {
    input.email = input.email.toLowerCase().trim();
    const existing = await User.findOne({ email: input.email, _id: { $ne: req.userId } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
  }

  const user = await User.findByIdAndUpdate(req.userId, input, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: serializeUser(user) });
}

export async function updateProfileImage(req: AuthRequest, res: Response) {
  if (!req.file) return res.status(400).json({ message: 'Profile image is required' });

  const uploadedImage = await uploadProfileImageToCloudinary(req.file);
  const user = await User.findByIdAndUpdate(req.userId, { profileImage: uploadedImage.secureUrl }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  return res.json({ user: serializeUser(user) });
}

export async function deleteMe(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const assignments = await Assignment.find({ teacherId: userId }).select('_id');
  const assignmentIds = assignments.map((assignment) => assignment._id);

  await GeneratedPaper.deleteMany({ assignmentId: { $in: assignmentIds } });
  await Assignment.deleteMany({ teacherId: userId });
  await RefreshToken.deleteMany({ userId });
  const deletedUser = await User.findByIdAndDelete(userId);

  if (!deletedUser) return res.status(404).json({ message: 'User not found' });
  res.clearCookie('refreshToken');
  return res.json({ message: 'Account deleted' });
}
