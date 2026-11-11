import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import Admin from '../models/Admin.js'
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const createSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().max(254), password: z.string().min(12).max(200), role: z.enum(['admin', 'super-admin']).default('admin') })
const updateSchema = z.object({ name: z.string().trim().min(2).max(100).optional(), role: z.enum(['admin', 'super-admin']).optional(), password: z.string().min(12).max(200).optional() })
router.use(requireAdmin, requireSuperAdmin)

router.get('/', asyncHandler(async (_req, res) => res.json({ data: await Admin.find().select('name email role createdAt').sort({ createdAt: 1 }) })))
router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.validatedBody
  const data = await Admin.create({ name, email, password: await bcrypt.hash(password, 12), role })
  res.status(201).json({ data: { id: data.id, name: data.name, email: data.email, role: data.role } })
}))
router.put('/:id', validate(updateSchema), asyncHandler(async (req, res) => {
  const data = await Admin.findById(req.params.id).select('+password')
  if (!data) return res.status(404).json({ message: 'Administrator not found.' })
  if (data.id === req.admin.id && req.validatedBody.role === 'admin') return res.status(400).json({ message: 'You cannot remove your own super-admin role.' })
  if (req.validatedBody.role === 'admin' && data.role === 'super-admin' && await Admin.countDocuments({ role: 'super-admin' }) === 1) return res.status(400).json({ message: 'At least one super-admin must remain.' })
  if (req.validatedBody.name) data.name = req.validatedBody.name
  if (req.validatedBody.role) data.role = req.validatedBody.role
  if (req.validatedBody.password) { data.password = await bcrypt.hash(req.validatedBody.password, 12); data.tokenVersion += 1 }
  await data.save()
  res.json({ data: { id: data.id, name: data.name, email: data.email, role: data.role } })
}))
router.delete('/:id', asyncHandler(async (req, res) => {
  const data = await Admin.findById(req.params.id)
  if (!data) return res.status(404).json({ message: 'Administrator not found.' })
  if (data.id === req.admin.id) return res.status(400).json({ message: 'You cannot delete your own account.' })
  if (data.role === 'super-admin' && await Admin.countDocuments({ role: 'super-admin' }) === 1) return res.status(400).json({ message: 'At least one super-admin must remain.' })
  await data.deleteOne()
  res.json({ message: 'Administrator deleted.' })
}))

export default router