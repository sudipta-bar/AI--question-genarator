import { Router } from 'express';
import { changePassword, deleteMe, login, logout, me, refresh, register, updateMe, updateProfileImage } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { profileImageUpload } from '../middleware/upload.js';

export const authRouter = Router();

authRouter.post('/register', profileImageUpload.single('profileImage'), register);
authRouter.post('/login', login);
authRouter.post('/change-password', changePassword);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', me);
authRouter.patch('/me', authenticate, updateMe);
authRouter.patch('/me/profile-image', authenticate, profileImageUpload.single('profileImage'), updateProfileImage);
authRouter.delete('/me', authenticate, deleteMe);
