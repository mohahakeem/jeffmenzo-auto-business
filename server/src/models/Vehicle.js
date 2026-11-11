import mongoose from 'mongoose'

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true, trim: true, maxlength: 80 },
  model: { type: String, required: true, trim: true, maxlength: 100 },
  year: { type: Number, required: true, min: 1950, max: new Date().getFullYear() + 2 },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'GHS', enum: ['GHS', 'USD', 'EUR', 'GBP'] },
  mileage: { type: Number, min: 0, default: 0 },
  transmission: { type: String, trim: true, default: '' },
  fuelType: { type: String, trim: true, default: '' },
  engineCapacity: { type: String, trim: true, default: '' },
  exteriorColor: { type: String, trim: true, default: '' },
  interiorColor: { type: String, trim: true, default: '' },
  condition: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, maxlength: 5000, default: '' },
  images: [{ url: { type: String, required: true }, publicId: { type: String, default: '' } }],
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
  slug: { type: String, unique: true, sparse: true },
}, { timestamps: true })

vehicleSchema.index({ make: 'text', model: 'text' })
vehicleSchema.index({ status: 1, featured: 1, createdAt: -1 })
export default mongoose.model('Vehicle', vehicleSchema)