import { Router } from 'express'
import { z } from 'zod'
import Vehicle from '../models/Vehicle.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { slugify } from '../utils/slug.js'

const router = Router()
const vehicleSchema = z.object({
  make: z.string().trim().min(1).max(80), model: z.string().trim().min(1).max(100),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 2), price: z.coerce.number().nonnegative(),
  currency: z.enum(['GHS', 'USD', 'EUR', 'GBP']).default('GHS'), mileage: z.coerce.number().nonnegative().default(0),
  transmission: z.string().max(80).optional().default(''), fuelType: z.string().max(80).optional().default(''),
  engineCapacity: z.string().max(80).optional().default(''), exteriorColor: z.string().max(80).optional().default(''),
  interiorColor: z.string().max(80).optional().default(''), condition: z.string().max(80).optional().default(''),
  description: z.string().max(5000).optional().default(''), images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional() })).max(12).optional().default([]),
  featured: z.boolean().optional().default(false), status: z.enum(['available', 'reserved', 'sold']).optional().default('available'),
})

router.get('/admin/list', requireAdmin, asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const limit = Math.min(1000, Math.max(1, Number.parseInt(req.query.limit, 10) || 1000))
  const filter = {}
  if (req.query.status && ['available', 'reserved', 'sold'].includes(req.query.status)) filter.status = req.query.status
  if (req.query.featured === 'true') filter.featured = true
  if (req.query.search) {
    const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = ['make', 'model'].map((field) => ({ [field]: new RegExp(search, 'i') }))
  }
  const [data, total] = await Promise.all([Vehicle.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Vehicle.countDocuments(filter)])
  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}))

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const limit = Math.min(48, Math.max(1, Number.parseInt(req.query.limit, 10) || 12))
  const filter = {}
  filter.status = 'available'
  if (req.query.featured === 'true') filter.featured = true
  if (req.query.make) filter.make = new RegExp(String(req.query.make).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  if (req.query.year && Number.isInteger(Number(req.query.year))) filter.year = Number(req.query.year)
  if (req.query.makeOrModel) {
    const search = String(req.query.makeOrModel).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = ['make', 'model'].map((field) => ({ [field]: new RegExp(search, 'i') }))
  }
  if (req.query.fuelType) filter.fuelType = String(req.query.fuelType).slice(0, 80)
  if (req.query.transmission) filter.transmission = String(req.query.transmission).slice(0, 80)
  if (req.query.minPrice || req.query.maxPrice) filter.price = { ...(Number.isFinite(Number(req.query.minPrice)) ? { $gte: Number(req.query.minPrice) } : {}), ...(Number.isFinite(Number(req.query.maxPrice)) ? { $lte: Number(req.query.maxPrice) } : {}) }
  if (req.query.search) {
    const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = ['make', 'model'].map((field) => ({ [field]: new RegExp(search, 'i') }))
  }
  const sortOptions = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 } }
  const sort = sortOptions[req.query.sort] || sortOptions.newest
  const [data, total] = await Promise.all([Vehicle.find(filter).sort(sort).skip((page - 1) * limit).limit(limit), Vehicle.countDocuments(filter)])
  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const query = /^[a-f\d]{24}$/i.test(req.params.id) ? { _id: req.params.id } : { slug: req.params.id }
  const vehicle = await Vehicle.findOne(query)
  if (!vehicle || vehicle.status !== 'available') return res.status(404).json({ message: 'Vehicle not found.' })
  res.json({ data: vehicle })
}))

router.post('/', requireAdmin, validate(vehicleSchema), asyncHandler(async (req, res) => {
  const data = req.validatedBody
  data.slug = `${slugify(`${data.year}-${data.make}-${data.model}`)}-${Date.now().toString(36)}`
  res.status(201).json({ data: await Vehicle.create(data) })
}))

router.put('/:id', requireAdmin, validate(vehicleSchema.partial()), asyncHandler(async (req, res) => {
  const data = req.validatedBody
  if (data.make || data.model || data.year) {
    const current = await Vehicle.findById(req.params.id)
    if (!current) return res.status(404).json({ message: 'Vehicle not found.' })
    data.slug = `${slugify(`${data.year ?? current.year}-${data.make ?? current.make}-${data.model ?? current.model}`)}-${current.id.slice(-6)}`
  }
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' })
  res.json({ data: vehicle })
}))

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id)
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' })
  res.json({ message: 'Vehicle deleted.' })
}))

export default router