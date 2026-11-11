import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  image: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Service', serviceSchema)