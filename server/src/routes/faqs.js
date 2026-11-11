import { Router } from 'express'
import { z } from 'zod'
import FAQ from '../models/FAQ.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const schema = z.object({ question: z.string().trim().min(3).max(300), answer: z.string().trim().min(3).max(3000), order: z.coerce.number().int().default(0), isPublished: z.boolean().default(false) })
router.get('/', asyncHandler(async (_req, res) => res.json({ data: await FAQ.find({ isPublished: true }).sort({ order: 1, createdAt: 1 }) })))
router.get('/admin/list', requireAdmin, asyncHandler(async (_req, res) => res.json({ data: await FAQ.find().sort({ order: 1, createdAt: 1 }) })))
router.post('/', requireAdmin, validate(schema), asyncHandler(async (req, res) => res.status(201).json({ data: await FAQ.create(req.validatedBody) })))
router.put('/:id', requireAdmin, validate(schema.partial()), asyncHandler(async (req, res) => {
  const item = await FAQ.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true, runValidators: true })
  if (!item) return res.status(404).json({ message: 'FAQ not found.' })
  res.json({ data: item })
}))
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const item = await FAQ.findByIdAndDelete(req.params.id)
  if (!item) return res.status(404).json({ message: 'FAQ not found.' })
  res.json({ message: 'FAQ deleted.' })
}))
export default router