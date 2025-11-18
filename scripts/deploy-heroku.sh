#!/bin/bash
# deploy-heroku.sh - Deploy Gradient API to Heroku
# Usage: ./scripts/deploy-heroku.sh [app-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get app name from argument or prompt
APP_NAME=${1:-""}

if [ -z "$APP_NAME" ]; then
    echo -e "${YELLOW}Enter your Heroku app name:${NC}"
    read APP_NAME
fi

if [ -z "$APP_NAME" ]; then
    echo -e "${RED}Error: App name is required${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Deploying to Heroku app: $APP_NAME${NC}"

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}Error: Heroku CLI is not installed${NC}"
    echo "Install it from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Heroku:${NC}"
    heroku login
fi

# Check if app exists
if ! heroku apps:info -a "$APP_NAME" &> /dev/null; then
    echo -e "${YELLOW}App '$APP_NAME' not found. Creating...${NC}"
    heroku create "$APP_NAME"
fi

# Add Heroku remote if not exists
if ! git remote | grep -q heroku; then
    echo -e "${YELLOW}Adding Heroku remote...${NC}"
    heroku git:remote -a "$APP_NAME"
fi

# Check for Redis addon
if ! heroku addons -a "$APP_NAME" | grep -q redis; then
    echo -e "${YELLOW}Adding Redis addon...${NC}"
    heroku addons:create heroku-redis:mini -a "$APP_NAME"
fi

# Deploy
echo -e "${GREEN}📦 Pushing to Heroku...${NC}"
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    git push heroku "$BRANCH"
else
    git push heroku "$BRANCH":main
fi

# Run migrations
echo -e "${GREEN}🗄️  Running database migrations...${NC}"
heroku run npx prisma migrate deploy -a "$APP_NAME" || {
    echo -e "${YELLOW}Migration failed, trying db push...${NC}"
    heroku run npx prisma db push -a "$APP_NAME"
}

# Restart
echo -e "${GREEN}🔄 Restarting dynos...${NC}"
heroku restart -a "$APP_NAME"

# Show status
echo -e "${GREEN}📊 App Status:${NC}"
heroku ps -a "$APP_NAME"

# Get app URL
APP_URL=$(heroku apps:info -a "$APP_NAME" --json | grep -o '"web_url":"[^"]*' | cut -d'"' -f4)

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 App URL: ${APP_URL}${NC}"
echo -e "${GREEN}🔍 Health check: ${APP_URL}api/health${NC}"
echo ""
echo -e "${YELLOW}View logs with:${NC} heroku logs --tail -a $APP_NAME"
