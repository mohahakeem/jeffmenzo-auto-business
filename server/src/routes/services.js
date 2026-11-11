import { Router } from 'express'
import { z } from 'zod'
import Service from '../models/Service.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { slugify } from '../utils/slug.js'

const router = Router()
const serviceSchema = z.object({
  title: z.string().trim().min(2).max(100), description: z.string().trim().min(2).max(3000),
  image: z.object({ url: z.string().url(), publicId: z.string().optional() }).optional(), isActive: z.boolean().optional().default(true),
})

router.get('/', asyncHandler(async (_req, res) => res.json({ data: await Service.find({ isActive: true }).sort({ title: 1 }) })))
router.get('/admin/list', requireAdmin, asyncHandler(async (_req, res) => res.json({ data: await Service.find().sort({ createdAt: -1 }) })))
router.post('/', requireAdmin, validate(serviceSchema), asyncHandler(async (req, res) => {
  const data = req.validatedBody
  res.status(201).json({ data: await Service.create({ ...data, slug: `${slugify(data.title)}-${Date.now().toString(36)}` }) })
}))
router.put('/:id', requireAdmin, validate(serviceSchema.partial()), asyncHandler(async (req, res) => {
  const data = req.validatedBody
  if (data.title) data.slug = `${slugify(data.title)}-${Date.now().toString(36)}`
  const service = await Service.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
  if (!service) return res.status(404).json({ message: 'Service not found.' })
  res.json({ data: service })
}))
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id)
  if (!service) return res.status(404).json({ message: 'Service not found.' })
  res.json({ message: 'Service deleted.' })
}))

export default router