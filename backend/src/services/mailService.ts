import { env } from '../config/env.js';

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  console.info('[auth] password reset link generated', { email, resetUrl });
  if (env.NODE_ENV === 'production') {
    console.warn('[auth] email provider is not configured; reset link was logged server-side');
  }
}
