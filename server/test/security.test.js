import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import app from '../src/app.js'

test('health endpoint is public', async () => {
  const response = await request(app).get('/api/health')
  assert.equal(response.status, 200)
  assert.equal(response.body.status, 'ok')
})

test('vehicle management rejects unauthenticated writes', async () => {
  const response = await request(app).post('/api/vehicles').send({ make: 'Test', model: 'Car' })
  assert.equal(response.status, 401)
})

test('administrator-only reads reject unauthenticated requests', async () => {
  const response = await request(app).get('/api/vehicles/admin/list')
  assert.equal(response.status, 401)
})

test('public enquiry submission validates required fields', async () => {
  const response = await request(app).post('/api/enquiries').send({ name: 'A', phone: '1', subject: '', message: '' })
  assert.equal(response.status, 400)
  assert.equal(response.body.message, 'Please check the submitted information.')
})

test('public content updates reject unauthenticated requests', async () => {
  const response = await request(app).put('/api/content').send({ key: 'hero', value: { heading: 'Unauthorized' } })
  assert.equal(response.status, 401)
})

