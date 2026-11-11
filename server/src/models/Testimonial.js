import mongoose from 'mongoose'

const testimonialSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true, maxlength: 100 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Testimonial', testimonialSchema)