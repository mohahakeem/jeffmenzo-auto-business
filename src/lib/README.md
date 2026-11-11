# Jeffmenzo Auto & Business Ventures

A JavaScript MERN application with a responsive public website and a protected operations dashboard. The frontend is at the repository root; the Express/Mongoose API is under `server/`.

## Requirements

- Node.js 20 or newer and npm
- MongoDB Atlas (or a local MongoDB instance)
- Cloudinary credentials for admin image uploads

## Local setup

1. Install frontend dependencies with `npm install`.
2. Install API dependencies with `npm --prefix server install`.
3. Copy `.env.example` to `.env` and `server/.env.example` to `server/.env`.
4. Configure `MONGODB_URI`, a long random `JWT_SECRET`, and `CLIENT_URL` in `server/.env`. Add Cloudinary values to enable uploads. Keep both `.env` files out of source control.
5. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters in `server/.env`.
6. Run `npm run seed:admin` once. It creates the initial super-admin and, only when missing, the four requested service records plus editable starter website copy. It does not create vehicle records or customer testimonials.
7. Start the API with `npm run server` and the website with `npm run dev` in separate terminals.
8. Open the Vite URL (normally `http://localhost:5173`). Admin login is at `/admin/login`.

After bootstrap, remove the initial administrator password from `server/.env`. There is no public admin registration. A super-admin can create additional accounts and reset passwords under Admin > Settings.

## Configuration

The frontend API base URL is `VITE_API_URL` in the root `.env`. The API reads `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET` (at least 32 characters), `CLIENT_URL`, `COOKIE_SAME_SITE`, and Cloudinary credentials from `server/.env`. `CLIENT_URL` may be a comma-separated list of allowed origins. Cookies use `SameSite=Strict` locally and `SameSite=None; Secure` in production by default for separate frontend/API hosts; set `COOKIE_SAME_SITE` if your deployment topology requires another value. Public contact details are edited under Admin > Website content; unknown phone, email, address, social, map, and legal details are shown as unconfigured rather than fabricated.

Vehicle and service images are sent to the API and uploaded to Cloudinary. Image uploads accept JPEG, PNG, WebP, or AVIF up to 8 MB each. MongoDB stores their Cloudinary URLs and public IDs.

## Main API routes

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/change-password`
- `GET /api/vehicles`, `GET /api/vehicles/:id-or-slug`; protected `GET /api/vehicles/admin/list`, `POST`, `PUT /:id`, `DELETE /:id`
- `GET /api/services`; protected `GET /api/services/admin/list` and management routes
- `POST /api/enquiries`; protected enquiry listing, status/notes updates, and deletion
- `GET /api/content`; protected `PUT /api/content`
- Public published `GET /api/testimonials` and `GET /api/faqs`; protected management routes
- Protected `POST /api/uploads`, `GET /api/dashboard/stats`, and super-admin-only `/api/admin-users`

Admin JWTs are held in an HTTP-only cookie; the API enforces authorization on every management route and validates the `Origin` of cookie-authenticated mutations. Passwords are bcrypt-hashed. Admin sessions expire after eight hours and are invalidated after a password change/reset.

## Deployment

Deploy the API and frontend separately. For the API, configure the production environment variables, MongoDB Atlas network access, and Cloudinary credentials on the host. Set `CLIENT_URL` to the exact production frontend origin (plus any staging origin). For the frontend, run `npm run build`, deploy `dist/` to a static host, and set `VITE_API_URL` to the deployed API's `/api` URL at build time. Configure the frontend host to rewrite unknown routes to `index.html` for React Router. Point the domain DNS to the frontend host and enable HTTPS on both services.

Before launch, populate the public contact/legal content, test Atlas and Cloudinary from the deployed API, create the initial admin through the protected bootstrap command, and verify cross-origin cookie behavior on the production domains. Email delivery and self-service email password reset are not configured; password resets are performed by an authorized super-admin.
