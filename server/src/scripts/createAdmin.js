import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { connectDatabase } from '../config/db.js'
import Admin from '../models/Admin.js'
import Service from '../models/Service.js'
import WebsiteContent from '../models/WebsiteContent.js'

try {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters in server/.env.')
  await connectDatabase()
  const existingSuperAdmin = await Admin.findOne({ role: 'super-admin' })
  if (existingSuperAdmin) throw new Error('A super-admin already exists. Bootstrap is disabled.')
  const existingEmail = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() })
  if (existingEmail) throw new Error('An administrator with this email already exists.')
  const password = await bcrypt.hash(ADMIN_PASSWORD, 12)
  await Admin.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password, role: 'super-admin' })
  if (await Service.countDocuments() === 0) {
    await Service.insertMany([
      { title: 'Car Dealership', slug: 'car-dealership', description: 'Find a vehicle that suits your needs.', image: { url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=85' } },
      { title: 'Vehicle Importation', slug: 'vehicle-importation', description: 'Source vehicles from international markets.', image: { url: 'https://images.unsplash.com/photo-1566847438217-76e82d383f84?auto=format&fit=crop&w=1000&q=85' } },
      { title: 'Port Clearing', slug: 'port-clearing', description: 'Get assistance with vehicle and goods clearing procedures.', image: { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85' } },
      { title: 'Auction Car Purchasing', slug: 'auction-car-purchasing', description: 'Explore vehicles from international auction markets.', image: { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85' } },
    ])
  }
  const initialContent = [
    { key: 'hero', value: { heading: 'Drive Your Dream Vehicle', description: 'Discover quality vehicles and reliable clearing services you can trust.', backgroundImage: '' } },
    { key: 'about', value: { heading: 'Here to move you forward.', intro: 'Jeffmenzo Auto & Business Ventures helps customers find vehicles, source internationally, and navigate port clearing with personalized support.', mission: 'Make vehicle sourcing and importation easier to navigate.', vision: 'Build a trusted partner for every step of the journey.', values: 'Trust, clear communication, and personalized customer support.' } },
    { key: 'contact', value: { phone: '', email: '', address: '', whatsapp: '', mapUrl: '', facebook: '', instagram: '', tiktok: '' } },
    { key: 'footer', value: { description: 'Your partner for vehicle sales, international sourcing, importation, and port clearing services.' } },
    { key: 'legal', value: { privacy: '', terms: '' } },
  ]
  await Promise.all(initialContent.map(({ key, value }) => WebsiteContent.updateOne({ key }, { $setOnInsert: { value } }, { upsert: true })))
  console.log('Super-admin created. Remove the bootstrap credentials from the environment after this command.')
  process.exitCode = 0
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  const mongoose = await import('mongoose')
  await mongoose.default.disconnect()
}