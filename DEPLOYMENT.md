# Deployment Guide

This guide covers deploying the Pick-Up backend to production. The database is managed by Supabase.

## Quick Start (One-Shot Deployment)

```bash
./deploy.sh
```

Choose your deployment target:
1. **Heroku** - Deploy to Heroku platform
2. **Docker** - Build Docker image for any cloud provider
3. **Build only** - Just build the project locally

## Prerequisites

### All Deployments
- Node.js 18.x
- npm 9.x or higher
- Git repository initialized
- Supabase project set up with database

### For Heroku
- Heroku CLI installed ([Install guide](https://devcenter.heroku.com/articles/heroku-cli))
- Heroku account

### For Docker
- Docker installed

## Environment Variables

Required environment variables (get from Supabase dashboard):

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=gradients

# Authentication (Clerk)
CLERK_SECRET_KEY=your_clerk_secret
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI Service
OPENAI_API_KEY=your_openai_key
AI_MODEL=gpt-4-turbo-preview

# Redis (auto-configured on Heroku)
REDIS_URL=redis://localhost:6379

# Optional
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Deployment Methods

### Option 1: Heroku (Recommended)

1. **First-time setup:**
   ```bash
   # Set up environment variables
   ./scripts/setup-heroku-env.sh your-app-name
   ```

2. **Deploy:**
   ```bash
   ./deploy.sh
   # Select option 1 (Heroku)
   # Enter your app name
   ```

3. **Verify:**
   ```bash
   curl https://your-app-name.herokuapp.com/api/health
   ```

4. **View logs:**
   ```bash
   heroku logs --tail -a your-app-name
   ```

### Option 2: Docker

1. **Build image:**
   ```bash
   ./deploy.sh
   # Select option 2 (Docker)
   ```

2. **Run locally:**
   ```bash
   docker run -p 3000:3000 --env-file .env pick-up-be
   ```

3. **Deploy to cloud:**
   ```bash
   # Tag for your registry
   docker tag pick-up-be your-registry/pick-up-be

   # Push
   docker push your-registry/pick-up-be

   # Deploy to your cloud provider (AWS ECS, GCP Cloud Run, etc.)
   ```

### Option 3: Manual Build

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start
```

## Database Migrations

Since your database is on Supabase, run migrations locally against your Supabase database:

```bash
# Apply migrations
npx prisma migrate deploy

# Or push schema changes
npx prisma db push
```

**Note:** Migrations are NOT run automatically during deployment since the database is external.

## Troubleshooting

### Build Fails with Prisma Error

If you see Prisma binary fetch errors (403 Forbidden), the build script will continue with the existing Prisma client. This is expected in some network environments.

### Missing Environment Variables

The deployment script checks for required environment variables. If any are missing:

1. For Heroku: Run `./scripts/setup-heroku-env.sh your-app-name`
2. For Docker: Create a `.env` file based on `.env.example`

### Redis Connection Issues

On Heroku, Redis is auto-configured via the `heroku-redis:mini` addon. The deployment script adds this automatically.

For Docker/other platforms, set up your own Redis instance and configure `REDIS_URL`.

## Post-Deployment

1. **Health check:**
   ```bash
   curl https://your-domain/api/health
   ```

2. **Test API:**
   ```bash
   curl https://your-domain/api/gradients
   ```

3. **Monitor logs:**
   - Heroku: `heroku logs --tail -a your-app-name`
   - Docker: `docker logs -f container-id`

## CI/CD Integration

For automated deployments, you can use the deployment scripts in your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Deploy to Heroku
  run: |
    git push https://heroku:${{ secrets.HEROKU_API_KEY }}@git.heroku.com/${{ secrets.HEROKU_APP_NAME }}.git main
```

## Support

- Heroku Docs: https://devcenter.heroku.com/
- Docker Docs: https://docs.docker.com/
- Supabase Docs: https://supabase.com/docs
