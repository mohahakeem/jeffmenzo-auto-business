import { useEffect, useState } from 'react'
import { useLocation, useParams, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, CarFront, Check, ChevronLeft, ChevronRight, CircleAlert, LoaderCircle, Search, Send, SlidersHorizontal } from 'lucide-react'
import api, { getErrorMessage } from '../lib/api.js'
import { VehicleCard } from '../components/VehicleCard.jsx'

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(120),
  phone: z.string().trim().min(6, 'Enter a valid phone number.').max(40),
  email: z.union([z.string().email('Enter a valid email address.'), z.literal('')]).optional(),
  subject: z.string().trim().min(2, 'Enter a subject.').max(160),
  message: z.string().trim().min(5, 'Tell us a little more.').max(5000),
})

export function EnquiryForm({ category = 'general', subject = '', relatedVehicle = '', compact = false }) {
  const [state, setState] = useState({ loading: false, error: '', success: '' })
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(enquirySchema), defaultValues: { name: '', phone: '', email: '', subject, message: '' } })
  const submit = async (values) => {
    setState({ loading: true, error: '', success: '' })
    try {
      await api.post('/enquiries', { ...values, category, relatedVehicle: relatedVehicle || undefined })
      setState({ loading: false, error: '', success: 'Your enquiry has been sent. Our team will be in touch.' })
      reset({ name: '', phone: '', email: '', subject, message: '' })
    } catch (error) { setState({ loading: false, error: getErrorMessage(error), success: '' }) }
  }
  return <form className={`enquiry-form ${compact ? 'compact-form' : ''}`} onSubmit={handleSubmit(submit)} noValidate>
    <div className="form-grid"><Field label="Your name" error={errors.name?.message}><input autoComplete="name" {...register('name')} /></Field><Field label="Phone number" error={errors.phone?.message}><input autoComplete="tel" {...register('phone')} /></Field><Field label="Email (optional)" error={errors.email?.message}><input type="email" autoComplete="email" {...register('email')} /></Field><Field label="Subject" error={errors.subject?.message}><input {...register('subject')} /></Field></div>
    <Field label="How can we help?" error={errors.message?.message}><textarea rows={compact ? 4 : 5} {...register('message')} /></Field>
    {state.error && <p className="form-feedback error"><CircleAlert size={16} />{state.error}</p>}
    {state.success && <p className="form-feedback success"><Check size={16} />{state.success}</p>}
    <button className="button button-orange" type="submit" disabled={state.loading}>{state.loading ? <LoaderCircle className="spin" size={16} /> : <Send size={15} />}{state.loading ? 'Sending…' : 'Send enquiry'}</button>
  </form>
}

function Field({ label, error, children }) {
  return <label className="form-field"><span>{label}</span>{children}{error && <small className="field-error">{error}</small>}</label>
}

function PageIntro({ eyebrow, title, description }) {
  return <section className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</section>
}

export function InventoryPage() {
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState({ search: params.get('search') || '', year: params.get('year') || '', fuelType: params.get('fuelType') || '', transmission: params.get('transmission') || '', minPrice: params.get('minPrice') || '', maxPrice: params.get('maxPrice') || '', sort: params.get('sort') || 'newest' })
  const [result, setResult] = useState({ data: [], pagination: { page: 1, pages: 0, total: 0 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const page = Number(params.get('page')) || 1
  useEffect(() => {
    let active = true
    setLoading(true)
    api.get('/vehicles', { params: Object.fromEntries([...params.entries(), ['limit', '9']]) })
      .then(({ data }) => { if (active) { setResult(data); setError('') } })
      .catch((cause) => { if (active) setError(getErrorMessage(cause)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [params])
  const applyFilters = (event) => { event.preventDefault(); const next = new URLSearchParams(); Object.entries(form).forEach(([key, value]) => value && next.set(key, value)); next.set('page', '1'); setParams(next) }
  const setPage = (nextPage) => { const next = new URLSearchParams(params); next.set('page', String(nextPage)); setParams(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <><PageIntro eyebrow="The right car, found" title="Available vehicles" description="Explore our current selection, or get in touch if you have a particular vehicle in mind." />
    <section className="public-page inventory-page"><form className="filter-bar" onSubmit={applyFilters}><label className="search-control"><Search size={17} /><input placeholder="Search make or model" value={form.search} onChange={(event) => setForm({ ...form, search: event.target.value })} /></label><label><span>Year</span><input type="number" min="1950" max="2030" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} placeholder="Any" /></label><label><span>Fuel</span><select value={form.fuelType} onChange={(event) => setForm({ ...form, fuelType: event.target.value })}><option value="">Any fuel</option>{['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Transmission</span><select value={form.transmission} onChange={(event) => setForm({ ...form, transmission: event.target.value })}><option value="">Any</option>{['Automatic', 'Manual'].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Sort by</span><select value={form.sort} onChange={(event) => setForm({ ...form, sort: event.target.value })}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label><label><span>Min price</span><input type="number" min="0" value={form.minPrice} onChange={(event) => setForm({ ...form, minPrice: event.target.value })} /></label><label><span>Max price</span><input type="number" min="0" value={form.maxPrice} onChange={(event) => setForm({ ...form, maxPrice: event.target.value })} /></label><button className="button button-blue" type="submit"><SlidersHorizontal size={15} />Apply filters</button></form>
    <div className="inventory-meta"><span>{result.pagination.total} vehicle{result.pagination.total === 1 ? '' : 's'}</span></div>
      {error && <p className="empty-state"><CircleAlert />{error}</p>}{loading && <p className="empty-state"><LoaderCircle className="spin" />Loading vehicles…</p>}
      {!loading && !error && result.data.length > 0 && <div className="vehicle-grid">{result.data.map((vehicle) => <VehicleCard key={vehicle._id} vehicle={vehicle} />)}</div>}
      {!loading && !error && result.data.length === 0 && <p className="empty-state"><CarFront />No vehicles match those filters yet. Send us an enquiry and we can help source the right one.</p>}
      {result.pagination.pages > 1 && <div className="pagination"><button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={17} /></button><span>Page {page} of {result.pagination.pages}</span><button aria-label="Next page" disabled={page >= result.pagination.pages} onClick={() => setPage(page + 1)}><ChevronRight size={17} /></button></div>}
    </section></>
}

export function VehicleDetailsPage() {
  const { id } = useParams()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [contact, setContact] = useState({})
  useEffect(() => { let active = true; api.get(`/vehicles/${id}`).then(({ data }) => { if (active) setVehicle(data.data) }).catch((cause) => { if (active) setError(getErrorMessage(cause)) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [id])
  useEffect(() => { api.get('/content').then(({ data }) => setContact(data.data?.contact || {})).catch(() => {}) }, [])
  if (loading) return <p className="empty-state"><LoaderCircle className="spin" />Loading vehicle…</p>
  if (error || !vehicle) return <section className="public-page"><p className="empty-state"><CircleAlert />{error || 'Vehicle not found.'}</p><Link className="text-link" to="/inventory"><ArrowLeft size={16} />Back to inventory</Link></section>
  const photos = vehicle.images?.map((image) => typeof image === 'string' ? image : image.url).filter(Boolean) || []
  const whatsapp = String(contact.whatsapp || import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/[^\d]/g, '')
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello, I'm interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model}. Please share more details.`)}` : ''
  return <section className="public-page detail-page"><Link className="text-link back-link" to="/inventory"><ArrowLeft size={16} />All vehicles</Link><div className="detail-layout"><div><div className="detail-photo">{photos.length ? <img src={photos[selectedImage]} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} /> : <CarFront size={60} />}</div>{photos.length > 1 && <div className="detail-thumbs">{photos.map((photo, index) => <button key={photo} aria-label={`View image ${index + 1}`} className={index === selectedImage ? 'selected' : ''} onClick={() => setSelectedImage(index)}><img src={photo} alt="" /></button>)}</div>}</div><div className="detail-copy"><span className="eyebrow">{vehicle.status}</span><h1>{vehicle.year} {vehicle.make} {vehicle.model}</h1><strong className="detail-price">{new Intl.NumberFormat('en-GH', { style: 'currency', currency: vehicle.currency || 'GHS', maximumFractionDigits: 0 }).format(vehicle.price)}</strong><div className="detail-specs">{[['Mileage', `${Number(vehicle.mileage || 0).toLocaleString()} km`], ['Transmission', vehicle.transmission], ['Fuel type', vehicle.fuelType], ['Engine', vehicle.engineCapacity], ['Exterior', vehicle.exteriorColor], ['Condition', vehicle.condition]].filter(([, value]) => value).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p>{vehicle.description}</p><div className="detail-actions">{whatsappHref ? <a className="button button-orange" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp enquiry <ArrowRight size={15} /></a> : <Link className="button button-orange" to="/contact">Enquire about this car <ArrowRight size={15} /></Link>}{contact.phone ? <a className="button button-blue" href={`tel:${contact.phone}`}>Call now</a> : <Link className="button button-blue" to="/contact">Contact us</Link>}</div></div></div><div className="detail-enquiry"><div><span className="eyebrow">Interested?</span><h2>Ask us about this vehicle.</h2></div><EnquiryForm category="vehicle" subject={`Vehicle enquiry: ${vehicle.year} ${vehicle.make} ${vehicle.model}`} relatedVehicle={vehicle._id} compact /></div></section>
}

const serviceDetails = {
  'car-dealership': { title: 'Car Dealership', category: 'vehicle', intro: 'Find a vehicle that fits what you need, with guidance from our team.', points: ['Discuss your vehicle requirements', 'Explore available inventory', 'Compare vehicle details', 'Ask about availability', 'Arrange a customer enquiry'] },
  'clearing-services': { title: 'Port clearing support', category: 'clearing', intro: 'Practical assistance for clearing imported vehicles and general goods through the port.', points: ['Vehicle clearing support', 'General goods clearing', 'Import documentation assistance', 'Customs and port procedures guidance', 'Importation coordination'] },
  importation: { title: 'Vehicle importation', category: 'importation', intro: 'Support with sourcing vehicles internationally and coordinating the steps to bring them to Ghana.', points: ['Vehicle sourcing and selection', 'International auction purchasing', 'Importation coordination', 'Shipping guidance', 'Clearing assistance'] },
  'auction-sourcing': { title: 'Auction car purchasing', category: 'auction', intro: 'Tell us what you are looking for and we can help you navigate international vehicle auctions.', points: ['Understand your requirements', 'Find suitable auction listings', 'Assist with vehicle selection', 'Coordinate purchase and importation', 'Guide shipping and clearing'] },
}

export function ServicePage() {
  const { slug } = useParams()
  const [service, setService] = useState(null)
  const [faqs, setFaqs] = useState([])
  useEffect(() => { api.get('/services').then(({ data }) => setService(data.data.find((item) => item.slug === slug) || null)).catch(() => setService(null)); api.get('/faqs').then(({ data }) => setFaqs(data.data || [])).catch(() => setFaqs([])) }, [slug])
  const detailKey = slug.includes('clear') ? 'clearing-services' : slug.includes('auction') ? 'auction-sourcing' : slug.includes('import') ? 'importation' : slug
  const details = serviceDetails[detailKey] || serviceDetails.importation
  const title = service?.title || details.title
  const intro = service?.description || details.intro
  const category = details.category
  return <><PageIntro eyebrow="Our services" title={title} description={intro} /><section className="public-page service-detail"><div className="service-detail-copy"><h2>How we can help</h2><ul>{details.points.map((point) => <li key={point}><Check size={17} />{point}</li>)}</ul><p>Costs and timing depend on the vehicle, market, and import requirements. Contact us to discuss your specific needs.</p></div><div className="service-form-wrap"><span className="eyebrow">Start a conversation</span><h2>Tell us what you need.</h2><EnquiryForm category={category} subject={title} compact /></div></section>{faqs.length > 0 && <section className="public-page faq-section"><span className="eyebrow">Common questions</span><h2>Frequently asked questions</h2>{faqs.map((faq) => <details key={faq._id}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>}</>
}

export function ContactPage() {
  const [content, setContent] = useState({})
  useEffect(() => { api.get('/content').then(({ data }) => setContent(data.data || {})).catch(() => {}) }, [])
  const contact = content.contact || {}
  const whatsappNumber = String(contact.whatsapp || '').replace(/[^\d]/g, '')
  return <><PageIntro eyebrow="We’re ready to help" title="Let’s talk." description="Tell us what you’re looking for, and our team will be in touch." /><section className="public-page contact-page"><div className="contact-details"><h2>Contact details</h2><p>Reach out about vehicles, importation, or clearing support.</p><dl><div><dt>Phone</dt><dd>{contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : 'Business phone to be configured'}</dd></div><div><dt>Email</dt><dd>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : 'Business email to be configured'}</dd></div><div><dt>Office</dt><dd>{contact.address || 'Office location to be configured'}</dd></div><div><dt>WhatsApp</dt><dd>{whatsappNumber ? <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">{contact.whatsapp}</a> : 'WhatsApp contact to be configured'}</dd></div></dl>{contact.mapUrl && <a className="text-link" href={contact.mapUrl} target="_blank" rel="noreferrer">Open map <ArrowRight size={15} /></a>}<div className="contact-socials">{[['Facebook', contact.facebook], ['Instagram', contact.instagram], ['TikTok', contact.tiktok]].filter(([, url]) => url).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>)}</div></div><div className="contact-form-wrap"><h2>Send an enquiry</h2><EnquiryForm /></div></section></>
}

export function AboutPage() {
  const [content, setContent] = useState({})
  useEffect(() => { api.get('/content').then(({ data }) => setContent(data.data || {})).catch(() => {}) }, [])
  const about = content.about || {}
  return <><PageIntro eyebrow="About Jeffmenzo" title={about.heading || 'Here to move you forward.'} description={about.intro || 'Jeffmenzo Auto & Business Ventures helps customers find vehicles, source internationally, and navigate port clearing with personalized support.'} /><section className="public-page about-page"><div><span className="eyebrow">Our mission</span><h2>{about.mission || 'Make vehicle sourcing and importation easier to navigate.'}</h2></div><div><span className="eyebrow">Our vision</span><h2>{about.vision || 'Build a trusted partner for every step of the journey.'}</h2></div><div className="about-values"><span className="eyebrow">Our values</span><h2>{about.values || 'Trust, clear communication, and personalized customer support.'}</h2></div><div className="about-cta"><p>Looking for a vehicle or importation support?</p><Link className="button button-orange" to="/contact">Talk to our team <ArrowRight size={15} /></Link></div></section></>
}

export function LegalPage() {
  const location = useLocation()
  const isPrivacy = location.pathname === '/privacy'
  const [legal, setLegal] = useState({})
  useEffect(() => { api.get('/content').then(({ data }) => setLegal(data.data?.legal || {})).catch(() => {}) }, [])
  const title = isPrivacy ? 'Privacy policy' : 'Terms & conditions'
  const text = isPrivacy ? legal.privacy : legal.terms
  return <><PageIntro eyebrow="Website information" title={title} description="" /><section className="public-page legal-page"><p>{text || 'This information has not been configured yet. Please contact Jeffmenzo Auto & Business Ventures with any questions.'}</p></section></>
}