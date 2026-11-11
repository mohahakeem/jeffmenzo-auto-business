import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import vehicleRoutes from './routes/vehicles.js'
import enquiryRoutes from './routes/enquiries.js'
import serviceRoutes from './routes/services.js'
import contentRoutes from './routes/content.js'
import testimonialRoutes from './routes/testimonials.js'
import faqRoutes from './routes/faqs.js'
import uploadRoutes from './routes/uploads.js'
import dashboardRoutes from './routes/dashboard.js'
import adminUserRoutes from './routes/adminUsers.js'

const app = express()
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim())
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
  callback(new Error('Origin is not allowed by CORS.'))
}, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(mongoSanitize())
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.cookies.adminToken && !allowedOrigins.includes(req.get('origin'))) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }
  next()
})
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }))
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many sign-in attempts. Try again later.' } }))
app.use('/api/enquiries', rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/enquiries', enquiryRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/testimonials', testimonialRoutes)
app.use('/api/faqs', faqRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/admin-users', adminUserRoutes)
app.use((_req, res) => res.status(404).json({ message: 'Endpoint not found.' }))
app.use((error, _req, res, _next) => {
  if (error.name === 'MulterError') return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Each image must be smaller than 8 MB.' : 'Invalid upload.' })
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'The submitted data is invalid.' })
  if (error.name === 'CastError') return res.status(400).json({ message: 'The requested record identifier is invalid.' })
  if (error.code === 11000) return res.status(409).json({ message: 'A record with that value already exists.' })
  const status = error.statusCode || (error.message.includes('CORS') ? 403 : 500)
  if (status >= 500) console.error(error)
  res.status(status).json({ message: status >= 500 ? 'A server error occurred.' : error.message })
})

export default app