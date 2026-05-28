import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { env, getCloudinaryConfigIssues } from './config/env.js';
import { Assignment } from './models/Assignment.js';
import { assignmentsRouter } from './routes/assignments.js';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setSocketServer } from './services/socketService.js';
import { startGenerationWorker } from './queues/workers/generationWorker.js';
import { cleanupStaleGenerationJobs } from './queues/generationQueue.js';

console.log('=== ENV CHECK ===');
console.log('MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'SET' : 'MISSING');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING');
console.log('REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'MISSING');
console.log('=================');

const cloudinaryIssues = getCloudinaryConfigIssues();
if (cloudinaryIssues.length > 0) {
  console.warn('[cloudinary] PDF upload disabled until configuration is fixed:', cloudinaryIssues.join('; '));
}

const app = express();
const server = http.createServer(app);

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) return true;
  if (origin === env.FRONTEND_URL) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin);
}

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    callback(isAllowedOrigin(origin) ? null : new Error(`CORS blocked origin: ${origin}`), isAllowedOrigin(origin));
  },
  credentials: true,
};

const io = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/assignments', assignmentsRouter);
app.use(errorHandler);

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token as string | undefined;
  try {
    const payload = jwt.verify(token ?? '', env.JWT_ACCESS_SECRET) as { userId: string; type: string };
    if (payload.type !== 'access') throw new Error('Invalid token type');
    socket.data.userId = payload.userId;
  } catch {
    socket.disconnect();
    return;
  }
  socket.on('subscribe', async (assignmentId: string) => {
    const found = await Assignment.findOne({ _id: assignmentId, teacherId: socket.data.userId });
    if (found) socket.join(`assignment:${assignmentId}`);
  });
  socket.on('unsubscribe', (assignmentId: string) => socket.leave(`assignment:${assignmentId}`));
});

setSocketServer(io);

await connectDB();
await cleanupStaleGenerationJobs();

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.warn(`VedaAI API is already running on port ${env.PORT}. Reusing the existing server; no new backend instance was started.`);
    process.exit(0);
  }

  console.error('VedaAI API failed to start:', error.message);
  process.exit(1);
});

server.listen(env.PORT, () => {
  startGenerationWorker();
  console.log(`VedaAI API listening on ${env.PORT}`);
});
