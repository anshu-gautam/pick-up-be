# Setup Guide

Complete setup guide for the AI Gradient Generation API.

## Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **PostgreSQL** (via Supabase account)
- **Redis** ([Download](https://redis.io/download))
- **Git**

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd pick-up-be
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Supabase

1. Create a [Supabase](https://supabase.com) account
2. Create a new project
3. Go to Project Settings > API
4. Copy the following:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

## Step 4: Set Up Clerk

1. Create a [Clerk](https://clerk.com) account
2. Create a new application
3. Go to API Keys
4. Copy:
   - Secret Key (CLERK_SECRET_KEY)
   - Publishable Key (CLERK_PUBLISHABLE_KEY)

## Step 5: Set Up OpenAI

1. Create an [OpenAI](https://platform.openai.com) account
2. Go to API Keys
3. Create a new secret key (OPENAI_API_KEY)

## Step 6: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:
```env
NODE_ENV=development
PORT=3000

# Database (from Supabase)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Authentication (from Clerk)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
JWT_SECRET=your_random_secret_here

# AI Services (from OpenAI)
OPENAI_API_KEY=sk-...

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

## Step 7: Set Up Database

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy the contents of `database/schema.sql`
4. Paste and run it in the SQL Editor
5. Copy the contents of `database/migrations/001_create_functions.sql`
6. Paste and run it in the SQL Editor

Alternatively, if you have `psql` installed:
```bash
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f database/schema.sql
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f database/migrations/001_create_functions.sql
```

## Step 8: Start Redis

### macOS (via Homebrew):
```bash
brew services start redis
```

### Linux:
```bash
sudo systemctl start redis
```

### Windows:
Download and run Redis from [GitHub](https://github.com/microsoftarchive/redis/releases)

### Docker:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

## Step 9: Create Logs Directory

```bash
mkdir -p logs
```

## Step 10: Run the Application

### Development Mode:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production Mode:
```bash
npm run build
npm start
```

## Step 11: Verify Installation

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the API information page
3. Check health endpoint: `http://localhost:3000/api/health`

## Step 12: Run Tests

```bash
npm test
```

## Docker Setup (Alternative)

If you prefer using Docker:

1. Make sure Docker and Docker Compose are installed
2. Update `.env` with your credentials
3. Run:
```bash
docker-compose up -d
```

This will start both the API and Redis in containers.

## Troubleshooting

### Redis Connection Error

If you see "Redis connection failed":
- Ensure Redis is running: `redis-cli ping` (should return "PONG")
- Check REDIS_URL in .env matches your Redis configuration

### Database Connection Error

If you see "Database connection failed":
- Verify Supabase credentials in .env
- Ensure database schema has been created
- Check Supabase project status

### OpenAI API Error

If AI generation fails:
- Verify OPENAI_API_KEY is correct
- Check OpenAI account has credits
- Ensure API key has proper permissions

### Port Already in Use

If port 3000 is already in use:
- Change PORT in .env to another port (e.g., 3001)
- Or stop the service using port 3000

## Next Steps

1. **Configure Clerk Webhooks**:
   - Set up webhooks in Clerk dashboard
   - Point to `https://your-domain.com/api/webhooks/clerk`

2. **Set Up Monitoring**:
   - Configure log aggregation
   - Set up error tracking (e.g., Sentry)

3. **Deploy**:
   - See deployment guides for:
     - [Vercel](https://vercel.com/docs)
     - [Railway](https://docs.railway.app)
     - [Heroku](https://devcenter.heroku.com)
     - [AWS](https://aws.amazon.com/getting-started/)

## Support

For issues and questions:
- Check the [README.md](README.md)
- Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- Open an issue on GitHub
