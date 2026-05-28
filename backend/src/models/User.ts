import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  profileImage: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/w_240,h_240,c_fill,g_face,r_max,f_auto,q_auto/avatar-placeholder.png',
  },
  schoolName: { type: String, default: '' },
  city: { type: String, default: '' },
  themePreference: { type: String, enum: ['light', 'dark'], default: 'light' },
  role: { type: String, enum: ['teacher', 'admin'], default: 'teacher' },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', UserSchema);
