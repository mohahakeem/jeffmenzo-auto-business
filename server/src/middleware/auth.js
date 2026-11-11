import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const requireAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.adminToken
  if (!token) return res.status(401).json({ message: 'Authentication required.' })
  let payload
  try { payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'jeffmenzo-api', audience: 'jeffmenzo-admin' }) }
  catch { return res.status(401).json({ message: 'Your session has expired. Please sign in again.' }) }
  const admin = await Admin.findById(payload.sub).select('name email role tokenVersion')
  if (!admin || admin.tokenVersion !== payload.ver) return res.status(401).json({ message: 'Administrator session is no longer valid.' })
  req.admin = admin
  next()
})

export function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== 'super-admin') return res.status(403).json({ message: 'Super-admin access required.' })
  next()
}