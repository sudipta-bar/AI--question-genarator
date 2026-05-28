import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const requiredEnv = [
  'MONGODB_URI',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: Missing env var: ${key}`);
    process.exit(1);
  }
});

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32).default('your_access_secret_min_32_chars_here'),
  JWT_REFRESH_SECRET: z.string().min(32).default('your_refresh_secret_min_32_chars_here'),
  MISTRAL_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  UPLOAD_DIR: z.string().default('./uploads'),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const messages = parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  console.error('\nEnvironment configuration error:');
  messages.forEach((message) => console.error(`- ${message}`));
  console.error('\nUpdate backend/.env and restart the backend.\n');
  throw new Error('Invalid environment configuration');
}

export const env = parsedEnv.data;

export function getCloudinaryConfigIssues() {
  const issues: string[] = [];
  if (!env.CLOUDINARY_API_KEY) issues.push('CLOUDINARY_API_KEY is missing');
  if (!env.CLOUDINARY_API_SECRET || env.CLOUDINARY_API_SECRET.startsWith('YOUR_ACTUAL_')) issues.push('CLOUDINARY_API_SECRET must be set to the real Cloudinary API secret');
  if (!env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_CLOUD_NAME.startsWith('YOUR_ACTUAL_')) {
    issues.push('CLOUDINARY_CLOUD_NAME must be set to the real Cloudinary cloud name');
  } else if (!/^[a-z0-9-]+$/.test(env.CLOUDINARY_CLOUD_NAME)) {
    issues.push('CLOUDINARY_CLOUD_NAME must be lowercase and may only contain letters, numbers, and hyphens');
  }
  return issues;
}

const cloudinaryConfigIssues = getCloudinaryConfigIssues();
if (cloudinaryConfigIssues.length > 0) {
  console.error('\nCloudinary configuration error:');
  cloudinaryConfigIssues.forEach((message) => console.error(`- ${message}`));
  console.error('\nUpdate backend/.env and restart the backend.\n');
  throw new Error('Invalid Cloudinary configuration');
}
