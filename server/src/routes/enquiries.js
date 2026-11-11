import { Router } from 'express'
import { z } from 'zod'
import Enquiry from '../models/Enquiry.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const createSchema = z.object({
  name: z.string().trim().min(2).max(120), phone: z.string().trim().min(6).max(40),
  email: z.union([z.string().email().max(254), z.literal('')]).optional().default(''),
  category: z.enum(['general', 'vehicle', 'clearing', 'importation', 'auction']).default('general'),
  subject: z.string().trim().min(2).max(160), message: z.string().trim().min(5).max(5000),
  relatedVehicle: z.string().regex(/^[a-f\d]{24}$/i).optional().nullable(),
})
const updateSchema = z.object({ status: z.enum(['new', 'read', 'in-progress', 'resolved']).optional(), adminNotes: z.string().max(5000).optional() })

router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.create(req.validatedBody)
  res.status(201).json({ message: 'Your enquiry has been received.', data: enquiry })
}))
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const limit = Math.min(1000, Math.max(1, Number.parseInt(req.query.limit, 10) || 1000))
  const filter = {}
  if (['new', 'read', 'in-progress', 'resolved'].includes(req.query.status)) filter.status = req.query.status
  if (['general', 'vehicle', 'clearing', 'importation', 'auction'].includes(req.query.category)) filter.category = req.query.category
  if (req.query.search) {
    const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = ['name', 'email', 'phone', 'subject'].map((field) => ({ [field]: new RegExp(search, 'i') }))
  }
  const [data, total] = await Promise.all([Enquiry.find(filter).populate('relatedVehicle', 'make model year').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Enquiry.countDocuments(filter)])
  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}))
router.get('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const data = await Enquiry.findById(req.params.id).populate('relatedVehicle', 'make model year')
  if (!data) return res.status(404).json({ message: 'Enquiry not found.' })
  res.json({ data })
}))
router.put('/:id', requireAdmin, validate(updateSchema), asyncHandler(async (req, res) => {
  const data = await Enquiry.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true, runValidators: true })
  if (!data) return res.status(404).json({ message: 'Enquiry not found.' })
  res.json({ data })
}))
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const data = await Enquiry.findByIdAndDelete(req.params.id)
  if (!data) return res.status(404).json({ message: 'Enquiry not found.' })
  res.json({ message: 'Enquiry deleted.' })
}))

export default router