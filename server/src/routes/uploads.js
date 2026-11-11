import { Router } from 'express'
import multer from 'multer'
import { fileTypeFromBuffer } from 'file-type'
import cloudinary from '../config/cloudinary.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, done) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) return done(Object.assign(new Error('Only JPEG, PNG, WebP, or AVIF images are allowed.'), { statusCode: 400 }))
    done(null, true)
  },
})

function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'jeffmenzo', resource_type: 'image' }, (error, result) => error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id }))
    stream.end(buffer)
  })
}

router.post('/', requireAdmin, upload.array('images', 12), asyncHandler(async (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return res.status(503).json({ message: 'Image storage is not configured.' })
  if (!req.files?.length) return res.status(400).json({ message: 'Select at least one image.' })
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
  for (const file of req.files) {
    const detectedType = await fileTypeFromBuffer(file.buffer)
    if (!detectedType || !allowedTypes.has(detectedType.mime)) return res.status(400).json({ message: 'One or more files are not valid supported images.' })
  }
  const images = await Promise.all(req.files.map(({ buffer }) => uploadBuffer(buffer)))
  res.status(201).json({ data: images })
}))

export default router