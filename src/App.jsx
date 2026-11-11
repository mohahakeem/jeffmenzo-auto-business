import { useEffect, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, CarFront, CircleHelp, Compass, Globe2, Handshake, Menu, Ship, Star, X } from 'lucide-react'
import AdminApp from './admin/AdminApp.jsx'
import { AboutPage, ContactPage, InventoryPage, LegalPage, ServicePage, VehicleDetailsPage } from './pages/PublicPages.jsx'
import api from './lib/api.js'
import './app.css'
import './pages/public-pages.css'

const benefits = [
  { title: 'Quality Cars for Sale', text: 'Explore available vehicles to find one that suits your needs and budget.', icon: CarFront },
  { title: 'International Auction Sourcing', text: 'Get assistance purchasing auction vehicles from multiple international markets.', icon: Globe2 },
  { title: 'Port Clearing Assistance', text: 'Get support with the procedures for clearing imported vehicles and other goods.', icon: Ship },
  { title: 'Personalized Customer Support', text: 'Receive guidance based on your vehicle sourcing, importation, or clearing needs.', icon: Handshake },
]

function imageUrl(id, width = 900) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
}

function formatPrice(price, currency = 'GHS') {
  try { return new Intl.NumberFormat('en-GH', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price) }
  catch { return `${currency} ${Number(price).toLocaleString()}` }
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [['Home', '/', true], ['Inventory', '/inventory'], ['Clearing Services', '/services/port-clearing'], ['About Us', '/about'], ['Contact', '/contact']]
  return <header className="site-header">
    <Link className="brand" to="/" aria-label="Jeffmenzo Auto home">
      <span className="brand-mark"><CarFront size={21} strokeWidth={1.8} /></span>
      <span className="brand-copy"><strong>JEFFMENZO AUTO</strong><strong>& BUSINESS VENTURES</strong><small>DRIVE WITH CONFIDENCE</small></span>
    </Link>
    <button className="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
    <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
      {links.map(([label, href, end]) => <NavLink key={label} to={href} end={end} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}
      <Link className="button button-orange nav-cta" to="/contact" onClick={() => setMenuOpen(false)}>Enquire Now <ArrowUpRight size={15} /></Link>
    </nav>
  </header>
}

function VehicleCard({ vehicle }) {
  const image = vehicle.images?.[0]?.url || vehicle.images?.[0] || ''
  return <article className="vehicle-card">
    <Link className="vehicle-image" to={`/vehicles/${vehicle.slug || vehicle._id}`} aria-label={`View ${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
      {image ? <img src={image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} /> : <div className="image-placeholder"><CarFront size={36} /></div>}
      {vehicle.status && <span className="vehicle-status">{vehicle.status}</span>}
    </Link>
    <div className="vehicle-info">
      <div className="vehicle-title"><h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3><strong>{formatPrice(vehicle.price, vehicle.currency || 'GHS')}</strong></div>
      <div className="vehicle-specs"><span>{Number(vehicle.mileage || 0).toLocaleString()} km <small>Mileage</small></span><span>{vehicle.transmission || 'N/A'}<small>Transmission</small></span><span>{vehicle.fuelType || 'N/A'}<small>Fuel type</small></span></div>
      <Link className="button button-orange card-button" to={`/vehicles/${vehicle.slug || vehicle._id}`}>View details <ArrowRight size={14} /></Link>
    </div>
  </article>
}

function Home() {
  const [vehicles, setVehicles] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [services, setServices] = useState([])
  const [servicesState, setServicesState] = useState('loading')
  const [testimonials, setTestimonials] = useState([])
  const [content, setContent] = useState({})
  useEffect(() => {
    let active = true
    Promise.allSettled([api.get('/vehicles', { params: { featured: 'true', limit: 3 } }), api.get('/services'), api.get('/content'), api.get('/testimonials')])
      .then(([vehiclesResult, servicesResult, contentResult, testimonialsResult]) => {
        if (!active) return
        if (vehiclesResult.status === 'fulfilled') { setVehicles(vehiclesResult.value.data.data || []); setLoadState('ready') }
        else setLoadState('error')
        if (servicesResult.status === 'fulfilled') { setServices(servicesResult.value.data.data || []); setServicesState('ready') }
        else setServicesState('error')
        if (contentResult.status === 'fulfilled') setContent(contentResult.value.data.data || {})
        if (testimonialsResult.status === 'fulfilled') setTestimonials(testimonialsResult.value.data.data || [])
      })
    return () => { active = false }
  }, [])
  const hero = content.hero || {}
  const about = content.about || {}
  const heading = (hero.heading || 'Drive Your Dream Vehicle').split(' ')
  const firstLine = heading.slice(0, 2).join(' ')
  const secondLine = heading.slice(2).join(' ') || 'Vehicle'
  const serviceDestination = (slug) => `/services/${slug || 'vehicle-sourcing'}`

  return <>
    <section className="hero" id="home" style={{ backgroundImage: `linear-gradient(90deg, rgba(17, 26, 34, .68), rgba(17, 26, 34, .18)), url("${hero.backgroundImage || imageUrl('photo-1503376780353-7e6692767b70', 2000)}")` }}>
      <div className="hero-content">
        <span className="eyebrow hero-eyebrow">
          A better way to find your next car
          </span><h1>{firstLine}<br /><em>{secondLine}</em></h1><p>{hero.description || 'Discover quality vehicles and reliable clearing services you can trust.'}
            </p><div className="hero-actions"><Link className="button button-orange" to="/inventory">Browse available cars <ArrowRight size={16} /></Link><Link className="button button-outline" to="/services/clearing-services">Browse clearing services <ArrowDownRight size={16} /></Link></div></div>
      <span className="hero-index">01 <i /> GHANA · WORLDWIDE</span>
    </section>

    <section className="section inventory-section" id="inventory">
      <div className="section-heading"><div><span className="eyebrow">Curated for the road ahead</span><h2>Featured vehicles</h2></div><Link className="text-link" to="/inventory">Find your vehicle <ArrowUpRight size={16} /></Link></div>
      {loadState === 'loading' && <div className="vehicle-grid"><div className="loading-card" /><div className="loading-card" /><div className="loading-card" /></div>}
      {loadState === 'ready' && vehicles.length > 0 && <div className="vehicle-grid">{vehicles.slice(0, 3).map((vehicle) => <VehicleCard key={vehicle._id} vehicle={vehicle} />)}</div>}
      {loadState === 'ready' && vehicles.length === 0 && <div className="empty-inventory"><CarFront size={24} /><div><strong>New arrivals are on the way.</strong><p>Contact our team and tell us what you are looking for.</p></div><Link to="/contact" className="text-link">Make an enquiry <ArrowRight size={15} /></Link></div>}
      {loadState === 'error' && <div className="empty-inventory"><CircleHelp size={24} /><div><strong>Inventory is temporarily unavailable.</strong><p>Please contact our team for current vehicle availability.</p></div><Link to="/contact" className="text-link">Contact us <ArrowRight size={15} /></Link></div>}
      <Link className="button button-blue inventory-link" to="/inventory">Browse all cars <ArrowRight size={16} /></Link>
    </section>

    <section className="section services-section" id="services">
      <div className="section-heading"><div><span className="eyebrow">From sourcing to arrival</span><h2>Good service moves you forward.</h2></div><p>One trusted partner for your vehicle and importation needs.</p></div>
      <div className="services-grid">{services.map((service, index) => { const Icon = /clear/i.test(service.title) ? Ship : /auction/i.test(service.title) ? Compass : /import/i.test(service.title) ? Globe2 : CarFront; const image = service.image?.url || service.image; return <Link className="service-card" to={serviceDestination(service.slug)} key={service._id || service.title}>
        <div className="service-photo">{image ? <img src={image} alt="" loading="lazy" /> : <div className="service-image-empty"><Icon size={42} /></div>}<span className="service-number">0{index + 1}</span><span className="service-icon"><Icon size={20} /></span></div>
        <div className="service-copy"><div><h3>{service.title}</h3><p>{service.description}</p></div><ArrowUpRight className="service-arrow" size={19} /></div>
      </Link> })}</div>
      {servicesState === 'loading' && <div className="service-loading" aria-label="Loading services"><span /><span /><span /><span /></div>}
      {servicesState === 'ready' && services.length === 0 && <div className="empty-inventory"><CircleHelp size={24} /><div><strong>Service information is being updated.</strong><p>Contact our team to discuss your vehicle or clearing needs.</p></div><Link to="/contact" className="text-link">Contact us <ArrowRight size={15} /></Link></div>}
      {servicesState === 'error' && <div className="empty-inventory"><CircleHelp size={24} /><div><strong>Services are temporarily unavailable.</strong><p>Please contact our team to discuss your vehicle or clearing needs.</p></div><Link to="/contact" className="text-link">Contact us <ArrowRight size={15} /></Link></div>}
    </section>

    <section className="section trust-section" id="about">
      <div className="trust-intro"><span className="eyebrow">Why choose Jeffmenzo</span><h2>{about.heading || 'Your trusted partner in cars, importation & port clearing.'}</h2><p>{about.intro || "Whether you're looking to buy a car, purchase a vehicle from an international auction, or clear imported goods from the port, we're here to assist you throughout the process."}</p><Link className="text-link" to="/about">Get to know us <ArrowUpRight size={16} /></Link></div>
      <div className="benefits-grid">{benefits.map(({ title, text, icon: Icon }, index) => <article className="benefit" key={title}><span className="benefit-icon"><Icon size={20} /></span><span className="benefit-number">0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    {testimonials.length > 0 && <section className="section testimonials-section"><div className="section-heading"><div><span className="eyebrow">Customer experiences</span><h2>Good journeys are shared.</h2></div></div><div className="testimonials-grid">{testimonials.map((item) => <article key={item._id}><span className="testimonial-rating">{Array.from({ length: item.rating || 5 }, (_, index) => <Star key={index} size={13} fill="currentColor" />)}</span><p>{item.message}</p><strong>{item.customerName}</strong></article>)}</div></section>}

    <section className="contact-banner" id="contact"><div><span className="eyebrow">Let’s make it happen</span><h2>Ready to get started?</h2><p>Tell us what you need. Our team is ready to help you take the next step.</p></div><Link className="button button-light" to="/contact">Talk to our team <ArrowRight size={17} /></Link><span className="banner-mark"><BadgeCheck size={170} strokeWidth={0.6} /></span></section>
  </>
}

function Footer() {
  const [content, setContent] = useState({})
  const [services, setServices] = useState([])
  useEffect(() => { api.get('/content').then(({ data }) => setContent(data.data || {})).catch(() => {}); api.get('/services').then(({ data }) => setServices(data.data || [])).catch(() => {}) }, [])
  const contact = content.contact || {}
  return <footer className="site-footer"><div className="footer-main">
    <div className="footer-about"><Link className="brand footer-brand" to="/"><span className="brand-mark"><CarFront size={21} /></span><span className="brand-copy"><strong>JEFFMENZO AUTO</strong><strong>& BUSINESS VENTURES</strong><small>DRIVE WITH CONFIDENCE</small></span></Link><p>{content.footer?.description || 'Your partner for vehicle sales, international sourcing, importation, and port clearing services.'}</p></div>
    <div className="footer-column"><h3>Explore</h3><Link to="/">Home</Link><Link to="/inventory">Available cars</Link><Link to="/about">About us</Link><Link to="/contact">Contact</Link></div>
    <div className="footer-column"><h3>Our services</h3>{services.map((service) => <Link key={service._id} to={`/services/${service.slug}`}>{service.title}</Link>)}</div>
    <div className="footer-column footer-contact"><h3>Talk to us</h3>{contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : <span>Business phone to be configured</span>}{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <span>Business email to be configured</span>}<span>{contact.address || 'Office location to be configured'}</span><div className="footer-socials">{[['Facebook', contact.facebook], ['Instagram', contact.instagram], ['TikTok', contact.tiktok]].filter(([, url]) => url).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>)}</div><Link className="footer-enquire" to="/contact">Send an enquiry <ArrowUpRight size={14} /></Link></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} Jeffmenzo Auto & Business Ventures</span><div><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms & conditions</Link></div><span>Ghana <span className="footer-dot" /></span></div></footer>
}

function SiteLayout() {
  const location = useLocation()
  return <><Header /><main key={location.pathname}><Routes><Route path="/" element={<Home />} /><Route path="/inventory" element={<InventoryPage />} /><Route path="/vehicles/:id" element={<VehicleDetailsPage />} /><Route path="/services/:slug" element={<ServicePage />} /><Route path="/about" element={<AboutPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/privacy" element={<LegalPage />} /><Route path="/terms" element={<LegalPage />} /><Route path="*" element={<section className="public-page"><h1>Page not found</h1><Link to="/">Return home</Link></section>} /></Routes></main><Footer /></>
}

export default function App() {
  return <BrowserRouter><Routes><Route path="/admin/*" element={<AdminApp />} /><Route path="*" element={<SiteLayout />} /></Routes></BrowserRouter>
}