import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import Admin from '../models/Admin.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) })
const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(200) })
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'strict'), path: '/', maxAge: 8 * 60 * 60 * 1000 })

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.validatedBody
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password name email role tokenVersion')
  if (!admin || !(await bcrypt.compare(password, admin.password))) return res.status(401).json({ message: 'Email or password is incorrect.' })
  const token = jwt.sign({ sub: admin.id, ver: admin.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '8h', issuer: 'jeffmenzo-api', audience: 'jeffmenzo-admin' })
  res.cookie('adminToken', token, cookieOptions()).json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } })
}))

router.post('/logout', (req, res) => res.clearCookie('adminToken', { ...cookieOptions(), maxAge: undefined }).json({ message: 'Signed out.' }))
router.get('/me', requireAdmin, (req, res) => res.json({ admin: { id: req.admin.id, name: req.admin.name, email: req.admin.email, role: req.admin.role } }))
router.put('/change-password', requireAdmin, validate(passwordSchema), asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('+password')
  if (!await bcrypt.compare(req.validatedBody.currentPassword, admin.password)) return res.status(400).json({ message: 'Current password is incorrect.' })
  admin.password = await bcrypt.hash(req.validatedBody.newPassword, 12)
  admin.tokenVersion += 1
  await admin.save()
  res.clearCookie('adminToken', { ...cookieOptions(), maxAge: undefined }).json({ message: 'Password changed. Please sign in again.' })
}))

export default router