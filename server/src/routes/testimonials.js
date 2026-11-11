import { Router } from 'express'
import { z } from 'zod'
import Testimonial from '../models/Testimonial.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const schema = z.object({ customerName: z.string().trim().min(2).max(100), message: z.string().trim().min(3).max(2000), rating: z.coerce.number().int().min(1).max(5).default(5), isPublished: z.boolean().default(false) })
router.get('/', asyncHandler(async (_req, res) => res.json({ data: await Testimonial.find({ isPublished: true }).sort({ createdAt: -1 }) })))
router.get('/admin/list', requireAdmin, asyncHandler(async (_req, res) => res.json({ data: await Testimonial.find().sort({ createdAt: -1 }) })))
router.post('/', requireAdmin, validate(schema), asyncHandler(async (req, res) => res.status(201).json({ data: await Testimonial.create(req.validatedBody) })))
router.put('/:id', requireAdmin, validate(schema.partial()), asyncHandler(async (req, res) => {
  const item = await Testimonial.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true, runValidators: true })
  if (!item) return res.status(404).json({ message: 'Testimonial not found.' })
  res.json({ data: item })
}))
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const item = await Testimonial.findByIdAndDelete(req.params.id)
  if (!item) return res.status(404).json({ message: 'Testimonial not found.' })
  res.json({ message: 'Testimonial deleted.' })
}))
export default router