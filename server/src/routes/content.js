import { Router } from 'express'
import { z } from 'zod'
import WebsiteContent from '../models/WebsiteContent.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const contentSchema = z.object({ key: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/), value: z.unknown() })

router.get('/', asyncHandler(async (_req, res) => {
  const records = await WebsiteContent.find().select('key value -_id')
  res.json({ data: Object.fromEntries(records.map(({ key, value }) => [key, value])) })
}))
router.put('/', requireAdmin, validate(contentSchema), asyncHandler(async (req, res) => {
  const { key, value } = req.validatedBody
  const record = await WebsiteContent.findOneAndUpdate({ key }, { value }, { upsert: true, new: true, runValidators: true })
  res.json({ data: record })
}))

export default router