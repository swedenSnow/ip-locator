# IP Locator

A sleek, terminal-styled app that displays visitor IP address and geolocation data, with database logging.

## Features

- 🌍 Shows IP address, city, region, country
- 📍 Displays coordinates, timezone, ISP info
- 📱 GPS geolocation support (precise location tracking)
- 🗺️ Reverse geocoding for GPS coordinates
- 📏 Location distance calculation (IP vs GPS)
- 🗺️ Links to OpenStreetMap for location preview
- 💾 Saves all visits to PostgreSQL database
- 🔐 Admin authentication system with session management
- 📊 Protected admin dashboard with visit logs
- ⚡ No external API key required
- 🔒 Type-safe database operations with Drizzle ORM

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Drizzle ORM (3 tables)
- **Authentication**: bcryptjs + session cookies
- **Geolocation**: ip-api.com + Nominatim (OpenStreetMap)
- **Password Hashing**: bcryptjs
- **Cookie Management**: cookie

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL installed locally (or use a cloud provider)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with your database URL
echo "DATABASE_URL=postgres://username@localhost:5432/ip_locator" > .env.local

# 3. Create the database (if using local PostgreSQL)
createdb ip_locator

# 4. Push schema to database
npm run db:push

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Management

This project uses **Drizzle ORM** for type-safe database operations and migrations.

### Available Scripts

```bash
npm run db:push       # Push schema changes directly to DB (dev only)
npm run db:generate   # Generate migration files from schema changes
npm run db:migrate    # Run pending migrations
npm run db:studio     # Open Drizzle Studio (visual DB browser)
```

### Making Schema Changes

1. Edit `db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review the migration in `db/migrations/`
4. Apply to database: `npm run db:migrate`

### Drizzle Studio

Browse and edit your database visually:

```bash
npm run db:studio
# Opens at https://local.drizzle.studio
```

## Database Schema

The database contains 3 tables for tracking visits and managing admin authentication:

### Database Tables

#### visits
Main visitor tracking table with IP and GPS data (29 columns):
- **IP-based location**: city, region, country, coordinates
- **GPS data**: latitude, longitude, accuracy
- **GPS-derived address**: street, city, region, ZIP (from reverse geocoding)
- **GPS metadata**: permission status, error messages
- **Location distance**: calculated distance between IP and GPS coordinates
- **ISP and browser**: information, user agent

#### admins
Stores admin user credentials:
- `username` (unique) - Admin username or email
- `password_hash` - bcrypt hashed password
- `created_at`, `last_login_at` - Timestamps

#### sessions
Manages authentication sessions:
- `session_token` (UUID) - Random session identifier
- `admin_id` - Foreign key to admins table
- `expires_at` - 7-day expiration timestamp
- `created_at` - Session creation timestamp

## API Endpoints

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| GET | `/api/location` | No | Get IP geolocation data and save to DB |
| POST | `/api/location` | No | Save GPS coordinates for a visit |
| GET | `/api/visits` | **Yes** | Fetch visit logs with pagination (admin only) |
| POST | `/api/auth/login` | No | Admin login endpoint |
| POST | `/api/auth/logout` | No | Admin logout endpoint |

**Note**: Protected endpoints require a valid session cookie obtained through `/api/auth/login`.

### Example Response

```json
// GET /api/location
{
  "query": "8.8.8.8",
  "country": "United States",
  "city": "Mountain View",
  "lat": 37.4056,
  "lon": -122.0775,
  "visitId": 42,
  "savedAt": "2024-01-15T10:30:00.000Z"
}
```

## Authentication

The admin dashboard is protected with session-based authentication.

### Features

- Username/password login
- bcrypt password hashing (10 salt rounds)
- Session-based auth with httpOnly cookies
- 7-day session expiration
- Automatic session cleanup

### Admin Routes

- `/login` - Admin login page
- `/admin` - Protected admin dashboard

### Creating Admin Users

Create your first admin user with the interactive CLI:

```bash
npm run create-admin
```

Follow the prompts to enter:
1. Username (can be email or simple username)
2. Password (minimum 8 characters)
3. Confirm password

The script will validate input, check for duplicates, hash the password, and insert the admin user into the database.

### Security Features

- Passwords hashed with bcrypt before storage
- Sessions stored in database for easy revocation
- httpOnly cookies prevent XSS attacks
- sameSite='lax' for CSRF protection
- Generic error messages prevent username enumeration
- Server-side route protection (no client-only checks)

## Deploy to Render

### Prerequisites

1. PostgreSQL database (Render provides free tier)
2. GitHub repository

### Steps

1. **Create Database**:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - New → PostgreSQL
   - Name: `ip-locator-db`
   - Free tier is fine
   - Create Database
   - Copy the **Internal Database URL**

2. **Deploy App**:
   - New → Web Service
   - Connect your GitHub repo
   - Name: `ip-locator`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Add Environment Variable**:
   - Go to Environment
   - Add `DATABASE_URL` = (paste Internal Database URL)
   - Save Changes

4. **Run Migrations**:
   - After first deploy, go to Shell tab
   - Run: `npm run db:push`

Your app will be live at `https://ip-locator.onrender.com`

## Free Database Options

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **Render** | 256 MB, expires after 90 days | Easy integration |
| **Supabase** | 500 MB | Great dashboard, generous limits |
| **Neon** | 3 GB | Serverless Postgres, auto-suspend |
| **Railway** | $5 credit/month | Flexible, Docker support |

All work with this project - just update `DATABASE_URL` in `.env.local`

## Environment Variables

Create a `.env.local` file:

```bash
# PostgreSQL connection string
DATABASE_URL=postgres://username:password@host:port/database

# Examples:
# Local: postgres://user@localhost:5432/ip_locator
# Render: postgres://user:pass@dpg-xxx.render.com:5432/dbname
# Supabase: postgres://postgres:pass@db.xxx.supabase.co:5432/postgres
```

## Project Structure

```
ip-locator/
├── db/
│   ├── schema.ts          # Drizzle schema (3 tables)
│   ├── index.ts           # Database connection
│   └── migrations/        # Auto-generated migrations
├── pages/
│   ├── index.tsx          # Public IP locator page
│   ├── login.tsx          # Admin login page
│   ├── admin.tsx          # Protected admin dashboard
│   └── api/
│       ├── location.ts    # IP/GPS geolocation
│       ├── visits.ts      # Visit logs (protected)
│       └── auth/
│           ├── login.ts   # Login endpoint
│           └── logout.ts  # Logout endpoint
├── lib/
│   ├── auth.ts            # Authentication utilities
│   └── withAuth.ts        # API middleware
├── scripts/
│   └── create-admin.ts    # Admin user creation CLI
├── drizzle.config.ts      # Drizzle configuration
└── .env.local             # Environment variables (not in git)
```

## Rate Limits

| Service | Free Limit |
|---------|-----------|
| ip-api.com | 45 requests/minute (no key needed) |

For higher limits, consider:
- **ipapi.co** - 1000/day free
- **ipgeolocation.io** - 1000/day free (requires API key)

## License

MIT

## Contributing

Issues and PRs welcome!
