import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email').transform((email) => email.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const passwordStrengthSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/\d/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a symbol');

export const changePasswordSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordStrengthSchema,
    confirmNewPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, { path: ['confirmNewPassword'], message: 'Passwords do not match' })
  .refine((data) => data.currentPassword !== data.newPassword, { path: ['newPassword'], message: 'New password must be different' });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const settingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  schoolName: z.string().optional(),
  city: z.string().optional(),
  themePreference: z.enum(['light', 'dark']),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    schoolName: z.string().optional(),
    city: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
