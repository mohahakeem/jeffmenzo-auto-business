import mongoose from 'mongoose'

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true, maxlength: 300 },
  answer: { type: String, required: true, trim: true, maxlength: 3000 },
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true })

faqSchema.index({ isPublished: 1, order: 1 })
export default mongoose.model('FAQ', faqSchema)