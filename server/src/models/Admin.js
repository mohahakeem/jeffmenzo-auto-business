import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'super-admin'], default: 'admin' },
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.model('Admin', adminSchema)