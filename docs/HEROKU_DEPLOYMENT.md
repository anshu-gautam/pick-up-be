# Heroku Deployment Guide

Complete guide to deploy the Gradient Generation API on Heroku.

## Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Heroku account
- Git installed
- Supabase project set up
- OpenAI API key
- Clerk account set up

---

## Quick Deploy

### Option 1: Deploy Button

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Click the button above and fill in the required environment variables.

### Option 2: CLI Deployment

Follow the steps below for manual deployment.

---

## Step-by-Step Deployment

### 1. Login to Heroku

```bash
heroku login
```

### 2. Create Heroku App

```bash
# Create a new app
heroku create your-app-name

# Or create with specific region
heroku create your-app-name --region us
```

### 3. Add Redis Addon

Redis is required for rate limiting.

```bash
# Add Heroku Redis (mini plan is free)
heroku addons:create heroku-redis:mini -a your-app-name
```

### 4. Set Environment Variables

Set all required environment variables:

```bash
# Node environment
heroku config:set NODE_ENV=production -a your-app-name

# Supabase Configuration
heroku config:set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -a your-app-name
heroku config:set DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -a your-app-name
heroku config:set SUPABASE_URL="https://[PROJECT-REF].supabase.co" -a your-app-name
heroku config:set SUPABASE_ANON_KEY="your-anon-key" -a your-app-name
heroku config:set SUPABASE_SERVICE_KEY="your-service-key" -a your-app-name

# OpenAI Configuration
heroku config:set OPENAI_API_KEY="sk-your-openai-key" -a your-app-name
heroku config:set AI_MODEL="gpt-4-turbo-preview" -a your-app-name

# Clerk Authentication
heroku config:set CLERK_SECRET_KEY="sk_live_your-clerk-key" -a your-app-name
heroku config:set CLERK_PUBLISHABLE_KEY="pk_live_your-clerk-key" -a your-app-name

# CORS (update with your frontend URL)
heroku config:set CORS_ORIGIN="https://your-frontend.com" -a your-app-name

# Rate Limiting (optional - defaults are fine)
heroku config:set RATE_LIMIT_WINDOW_MS=900000 -a your-app-name
heroku config:set RATE_LIMIT_MAX_REQUESTS=100 -a your-app-name
```

### 5. Deploy

```bash
# Add Heroku remote
heroku git:remote -a your-app-name

# Push to Heroku
git push heroku main

# Or if you're on a different branch
git push heroku your-branch:main
```

### 6. Run Database Migrations

```bash
# Run Prisma migrations
heroku run npx prisma migrate deploy -a your-app-name

# Or push schema directly (for initial setup)
heroku run npx prisma db push -a your-app-name
```

### 7. Verify Deployment

```bash
# Check app status
heroku ps -a your-app-name

# View logs
heroku logs --tail -a your-app-name

# Open app in browser
heroku open -a your-app-name
```

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | No | Server port (Heroku sets this) | `3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://...` |
| `DIRECT_URL` | Yes | Direct DB connection for migrations | `postgresql://...` |
| `SUPABASE_URL` | Yes | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key | `eyJ...` |
| `OPENAI_API_KEY` | Yes | OpenAI API key | `sk-...` |
| `AI_MODEL` | No | OpenAI model | `gpt-4-turbo-preview` |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key | `sk_live_...` |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key | `pk_live_...` |
| `REDIS_URL` | Yes | Redis connection (auto-set by addon) | `redis://...` |
| `CORS_ORIGIN` | No | Allowed origins | `https://app.com` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window | `100` |

---

## Deployment Scripts

### deploy.sh

Create a deployment script for convenience:

```bash
#!/bin/bash
# deploy.sh - Deploy to Heroku

set -e

APP_NAME="your-app-name"

echo "🚀 Deploying to Heroku..."

# Ensure we're on the right branch
git checkout main

# Push to Heroku
git push heroku main

# Run migrations
echo "📦 Running database migrations..."
heroku run npx prisma migrate deploy -a $APP_NAME

# Restart dynos
echo "🔄 Restarting dynos..."
heroku restart -a $APP_NAME

# Show logs
echo "📋 Showing recent logs..."
heroku logs --tail -n 50 -a $APP_NAME

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

---

## Scaling

### Scale Web Dynos

```bash
# Scale to 1 dyno (default)
heroku ps:scale web=1 -a your-app-name

# Scale to multiple dynos for production
heroku ps:scale web=2 -a your-app-name
```

### Upgrade Dyno Type

```bash
# Use Standard dynos for production
heroku ps:type web=standard-1x -a your-app-name

# Or Performance dynos for high traffic
heroku ps:type web=performance-m -a your-app-name
```

---

## Monitoring

### View Logs

```bash
# Real-time logs
heroku logs --tail -a your-app-name

# Filter by source
heroku logs --tail --source app -a your-app-name

# View recent logs
heroku logs -n 200 -a your-app-name
```

### Check Metrics

```bash
# View dyno metrics
heroku ps -a your-app-name

# Check Redis status
heroku redis:info -a your-app-name
```

### Set Up Alerts

In the Heroku dashboard:
1. Go to your app
2. Click "More" > "View Metrics"
3. Set up alerting for response time, errors, etc.

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

Check if all dependencies are in `dependencies` (not `devDependencies`) that are needed at runtime.

```bash
# View build logs
heroku builds -a your-app-name
heroku builds:info -a your-app-name
```

#### 2. Prisma Generate Fails

Ensure Prisma can download binaries:

```bash
# Set binary targets in schema.prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}
```

#### 3. Redis Connection Issues

Verify Redis is provisioned:

```bash
heroku addons -a your-app-name
heroku config:get REDIS_URL -a your-app-name
```

#### 4. Memory Issues

If you see R14 (Memory quota exceeded):

```bash
# Upgrade dyno type
heroku ps:type web=standard-2x -a your-app-name
```

#### 5. Timeout Issues

For long-running AI requests, configure timeout:

```bash
# Set request timeout (max 30s on Heroku)
heroku config:set WEB_CONCURRENCY=2 -a your-app-name
```

### Debug Mode

```bash
# Run one-off dyno for debugging
heroku run bash -a your-app-name

# Inside dyno, you can:
node dist/index.js  # Start app manually
npx prisma studio   # Won't work (no browser)
```

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.14
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"

      - name: Run Migrations
        run: |
          heroku run npx prisma migrate deploy -a your-app-name
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
```

Add `HEROKU_API_KEY` to your GitHub repository secrets:
1. Go to Heroku Dashboard > Account Settings > API Key
2. Copy the API key
3. Add to GitHub repo > Settings > Secrets > Actions

---

## Production Checklist

Before going live:

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up Heroku Redis addon
- [ ] Run database migrations
- [ ] Test all endpoints
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain (optional)
- [ ] Enable SSL (automatic on Heroku)
- [ ] Scale dynos appropriately
- [ ] Set up CI/CD pipeline

---

## Custom Domain

### Add Custom Domain

```bash
# Add domain
heroku domains:add api.yourdomain.com -a your-app-name

# Get DNS target
heroku domains -a your-app-name
```

### Configure DNS

Add a CNAME record in your DNS provider:
- Type: CNAME
- Name: api
- Value: your-app-name.herokuapp.com

### Enable SSL

SSL is automatic on Heroku for custom domains using ACM (Automated Certificate Management).

---

## Cost Estimation

| Resource | Plan | Cost/Month |
|----------|------|------------|
| Web Dyno | Eco | $5 |
| Web Dyno | Basic | $7 |
| Web Dyno | Standard-1X | $25 |
| Redis | Mini | $0 (free) |
| Redis | Premium-0 | $15 |

**Recommended for production**: Standard-1X dyno + Redis Mini = ~$25/month

---

## Useful Commands

```bash
# App info
heroku info -a your-app-name

# View config vars
heroku config -a your-app-name

# Run one-off command
heroku run <command> -a your-app-name

# Restart app
heroku restart -a your-app-name

# Maintenance mode
heroku maintenance:on -a your-app-name
heroku maintenance:off -a your-app-name

# View releases
heroku releases -a your-app-name

# Rollback to previous release
heroku rollback v10 -a your-app-name
```

---

## Support

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Heroku Status](https://status.heroku.com/)
- [Node.js on Heroku](https://devcenter.heroku.com/articles/nodejs-support)
