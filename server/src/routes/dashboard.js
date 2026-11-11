import { Router } from 'express'
import Enquiry from '../models/Enquiry.js'
import Vehicle from '../models/Vehicle.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
router.get('/stats', requireAdmin, asyncHandler(async (_req, res) => {
  const [totalVehicles, availableVehicles, reservedVehicles, soldVehicles, featuredVehicles, totalEnquiries, newEnquiries, recentEnquiries, recentVehicles, monthlyEnquiries] = await Promise.all([
    Vehicle.countDocuments(), Vehicle.countDocuments({ status: 'available' }), Vehicle.countDocuments({ status: 'reserved' }), Vehicle.countDocuments({ status: 'sold' }), Vehicle.countDocuments({ featured: true }),
    Enquiry.countDocuments(), Enquiry.countDocuments({ status: 'new' }), Enquiry.find().sort({ createdAt: -1 }).limit(5).select('name subject category status createdAt'),
    Vehicle.find().sort({ createdAt: -1 }).limit(5).select('make model year price currency status createdAt'),
    Enquiry.aggregate([{ $match: { createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
  ])
  res.json({ data: { totalVehicles, availableVehicles, reservedVehicles, soldVehicles, featuredVehicles, totalEnquiries, newEnquiries, recentEnquiries, recentVehicles, monthlyEnquiries } })
}))
export default router