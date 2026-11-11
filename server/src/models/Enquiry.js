import mongoose from 'mongoose'

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  category: { type: String, enum: ['general', 'vehicle', 'clearing', 'importation', 'auction'], default: 'general' },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  relatedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  status: { type: String, enum: ['new', 'read', 'in-progress', 'resolved'], default: 'new' },
  adminNotes: { type: String, maxlength: 5000, default: '' },
}, { timestamps: true })

enquirySchema.index({ status: 1, createdAt: -1 })
export default mongoose.model('Enquiry', enquirySchema)