# IP Locator Setup Guide

Complete guide to setting up IP Locator locally and deploying to production.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL (local installation or cloud provider)
- Git

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

Choose one of these options:

#### Option A: Local PostgreSQL

```bash
# Create database
createdb ip_locator

# Create .env.local
echo "DATABASE_URL=postgres://yourusername@localhost:5432/ip_locator" > .env.local
```

Replace `yourusername` with your PostgreSQL username.

#### Option B: Cloud PostgreSQL (Supabase, Neon, etc.)

```bash
# Create .env.local with your cloud database URL
echo "DATABASE_URL=postgres://user:pass@host:5432/dbname" > .env.local
```

### 3. Initialize Database Schema

Using Drizzle, push the schema to your database:

```bash
npm run db:push
```

This creates all database tables automatically from `db/schema.ts`:
- `visits` - Main tracking table (29 columns) with IP and GPS data
- `admins` - Admin users with hashed passwords
- `sessions` - Authentication sessions

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Create Admin User

After setting up the database, create your first admin user to access the dashboard.

#### Create Admin Account

Run the interactive CLI script:

```bash
npm run create-admin
```

You'll be prompted for:
1. **Username** - Can be email or simple username
2. **Password** - Minimum 8 characters
3. **Confirm Password** - Must match

The script will:
- Validate input
- Check for duplicate usernames
- Hash the password with bcrypt
- Insert the admin user into the database

#### Password Requirements
- Minimum length: 8 characters
- Stored as bcrypt hash (never plaintext)
- Salt rounds: 10

#### Managing Admin Users

**Create additional admins:**
```bash
npm run create-admin
```

**View admin users:**
```bash
psql $DATABASE_URL -c "SELECT id, username, created_at, last_login_at FROM admins;"
```

**Delete an admin user:**
```bash
psql $DATABASE_URL -c "DELETE FROM admins WHERE username = 'username_here';"
```

#### Accessing the Admin Dashboard

1. Start the development server (if not running):
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Enter your admin credentials

4. You'll be redirected to the admin dashboard at `/admin`

#### Session Management

- Sessions last **7 days** from login
- Sessions are stored in the database
- Logout clears the session immediately
- Expired sessions are automatically cleaned up

## Database Management with Drizzle

This project uses **Drizzle ORM** for type-safe database operations.

### Database Scripts

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema directly to database (dev only) |
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |

### Making Schema Changes

When you need to modify the database schema:

1. **Edit the schema**:
   ```bash
   # Edit db/schema.ts
   # Example: Add a new column to visits table
   ```

2. **Generate migration**:
   ```bash
   npm run db:generate
   # Creates a new file in db/migrations/
   ```

3. **Review migration**:
   ```bash
   # Check db/migrations/ folder
   # Verify the SQL looks correct
   ```

4. **Apply migration**:
   ```bash
   npm run db:migrate
   # Applies changes to database
   ```

### Drizzle Studio

Browse and edit your database visually:

```bash
npm run db:studio
```

This opens Drizzle Studio at `https://local.drizzle.studio` where you can:
- View all tables and data
- Run queries
- Edit records
- Inspect relationships

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# PostgreSQL connection string
DATABASE_URL=postgres://username:password@host:port/database
```

### Examples

**Local PostgreSQL:**
```
DATABASE_URL=postgres://haniabuzeid@localhost:5432/ip_locator
```

**Supabase:**
```
DATABASE_URL=postgres://postgres:yourpassword@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

**Neon:**
```
DATABASE_URL=postgres://user:pass@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb
```

**Render:**
```
DATABASE_URL=postgres://user:pass@dpg-xxxxxxxxxxxx-a.oregon-postgres.render.com:5432/dbname
```

## Production Deployment (Render)

### Step 1: Create PostgreSQL Database

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - Name: `ip-locator-db`
   - Database: `ip_locator` (or any name)
   - User: auto-generated
   - Region: Choose closest to users
   - Plan: **Free** (256 MB, expires after 90 days)
4. Click **Create Database**
5. Copy the **Internal Database URL** (starts with `postgres://`)

### Step 2: Deploy Application

1. Push your code to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com)
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Configure:
   - Name: `ip-locator`
   - Environment: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: **Free**
6. Click **Create Web Service**

### Step 3: Add Environment Variables

1. Go to your web service → **Environment**
2. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: (paste Internal Database URL from Step 1)
3. Click **Save Changes**

The service will automatically redeploy.

### Step 4: Initialize Database

After the deployment completes:

1. Go to your web service → **Shell** tab
2. Run:
   ```bash
   npm run db:push
   ```

This creates all database tables (`visits`, `admins`, `sessions`) in your production database.

### Step 5: Create Production Admin User

In the same Shell tab:

```bash
npm run create-admin
```

Follow the prompts to create your first admin account for production.

### Step 6: Verify

Your app should now be live at `https://ip-locator.onrender.com` (or your chosen name).

Test the admin login at `https://ip-locator.onrender.com/login`

Visit the URL and verify:
- Location data loads
- Data is being saved (check admin page or Drizzle Studio)

## Alternative Database Providers

### Supabase (Recommended for production)

**Free Tier:** 500 MB storage, 2 GB bandwidth

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy **Connection string** (Transaction pooler recommended for serverless)
5. Add to `.env.local`:
   ```
   DATABASE_URL=postgres://postgres:password@db.xxx.supabase.co:5432/postgres
   ```
6. Run `npm run db:push`

### Neon (Serverless Postgres)

**Free Tier:** 3 GB storage, auto-suspend when idle

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Add to `.env.local`
5. Run `npm run db:push`

### Railway

**Free Tier:** $5 credit/month (runs out quickly)

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy PostgreSQL
3. Copy `DATABASE_URL` from Variables tab
4. Add to `.env.local`
5. Run `npm run db:push`

## Troubleshooting

### Database connection fails

**Error:** `connect ECONNREFUSED` or `password authentication failed`

**Solution:**
1. Verify `DATABASE_URL` in `.env.local` is correct
2. Check PostgreSQL is running: `pg_isready`
3. Verify database exists: `psql -l`
4. Test connection: `psql "postgres://user@localhost:5432/ip_locator"`

### Table doesn't exist

**Error:** `relation "visits" does not exist`

**Solution:**
```bash
npm run db:push
```

### Drizzle Studio won't open

**Solution:**
1. Check if port 4983 is available
2. Try killing existing process: `lsof -ti:4983 | xargs kill`
3. Run `npm run db:studio` again

### TypeScript errors

**Solution:**
```bash
# Rebuild TypeScript files
npm run build
```

## Development Tips

### Viewing Database in Terminal

Using `psql`:

```bash
# Connect to database
psql -d ip_locator

# View all visits
SELECT * FROM visits ORDER BY visited_at DESC LIMIT 10;

# Count total visits
SELECT COUNT(*) FROM visits;

# Exit
\q
```

### Reset Database

**Warning:** This deletes ALL data!

```bash
# Drop and recreate database
dropdb ip_locator
createdb ip_locator

# Push schema
npm run db:push
```

### Backup Database

```bash
# Local backup
pg_dump ip_locator > backup.sql

# Restore
psql ip_locator < backup.sql
```

### Testing Authentication

**Test login flow:**
```bash
# In one terminal, start dev server
npm run dev

# Visit http://localhost:3000/admin
# Should redirect to /login

# After login, should redirect to /admin
# Logout button should clear session
```

**Test API protection:**
```bash
# Try accessing protected endpoint without auth
curl http://localhost:3000/api/visits
# Should return: {"error":"Unauthorized"}

# Login and get session cookie, then retry
# Should return visit data
```

**Check sessions in database:**
```bash
psql $DATABASE_URL -c "SELECT * FROM sessions;"

# View admins
psql $DATABASE_URL -c "SELECT id, username, created_at, last_login_at FROM admins;"
```

## Project Structure

```
ip-locator/
├── db/
│   ├── schema.ts          # Drizzle schema (3 tables)
│   ├── index.ts           # Database connection
│   └── migrations/        # Auto-generated migrations (git-tracked)
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
├── drizzle.config.ts      # Drizzle Kit configuration
├── .env.local             # Environment variables (DO NOT COMMIT)
└── .env.local.example     # Example env file (safe to commit)
```

## Next Steps

After setup:

1. **Create admin user**: Run `npm run create-admin` to create your first admin account
2. **Test locally**: Visit `http://localhost:3000` and verify location is detected
3. **Login to admin**: Visit `http://localhost:3000/login` and access the dashboard
4. **Check admin page**: View logged visits at `/admin`
5. **Try Drizzle Studio**: Run `npm run db:studio` to browse data
6. **Deploy**: Follow production deployment steps above

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ip-locator/issues)
- **Drizzle Docs**: [orm.drizzle.team](https://orm.drizzle.team)
- **Render Docs**: [render.com/docs](https://render.com/docs)
