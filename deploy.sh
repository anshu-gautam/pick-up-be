#!/bin/bash
# One-shot deployment script for pick-up-be backend
# Supports both Heroku and Docker deployments
# Database is managed by Supabase (no migrations needed)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}🚀 Pick-Up Backend Deployment${NC}"
echo ""

# Check for deployment target
echo -e "${CYAN}Select deployment target:${NC}"
echo "1) Heroku"
echo "2) Docker (local/cloud)"
echo "3) Build only"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "${GREEN}📦 Deploying to Heroku...${NC}"
        echo ""

        # Get app name
        read -p "Enter Heroku app name: " APP_NAME

        if [ -z "$APP_NAME" ]; then
            echo -e "${RED}Error: App name is required${NC}"
            exit 1
        fi

        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            echo -e "${RED}Error: Heroku CLI not installed${NC}"
            echo "Install from: https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi

        # Login check
        if ! heroku auth:whoami &> /dev/null; then
            echo -e "${YELLOW}Please login to Heroku:${NC}"
            heroku login
        fi

        # Create app if doesn't exist
        if ! heroku apps:info -a "$APP_NAME" &> /dev/null; then
            echo -e "${YELLOW}Creating app...${NC}"
            heroku create "$APP_NAME"
        fi

        # Add Heroku remote
        if ! git remote | grep -q heroku; then
            heroku git:remote -a "$APP_NAME"
        fi

        # Check for Redis addon
        echo -e "${YELLOW}Checking for Redis addon...${NC}"
        if ! heroku addons -a "$APP_NAME" | grep -q redis; then
            echo -e "${YELLOW}Adding Redis addon...${NC}"
            heroku addons:create heroku-redis:mini -a "$APP_NAME"
        fi

        # Check environment variables
        echo -e "${YELLOW}Checking environment variables...${NC}"
        REQUIRED_VARS=(
            "DATABASE_URL"
            "SUPABASE_URL"
            "SUPABASE_ANON_KEY"
            "SUPABASE_SERVICE_ROLE_KEY"
            "CLERK_SECRET_KEY"
            "OPENAI_API_KEY"
        )

        MISSING_VARS=()
        for var in "${REQUIRED_VARS[@]}"; do
            if ! heroku config:get "$var" -a "$APP_NAME" &> /dev/null || [ -z "$(heroku config:get "$var" -a "$APP_NAME")" ]; then
                MISSING_VARS+=("$var")
            fi
        done

        if [ ${#MISSING_VARS[@]} -gt 0 ]; then
            echo -e "${RED}Missing required environment variables:${NC}"
            printf '%s\n' "${MISSING_VARS[@]}"
            echo ""
            echo -e "${YELLOW}Run setup script first:${NC}"
            echo "./scripts/setup-heroku-env.sh $APP_NAME"
            exit 1
        fi

        echo -e "${GREEN}All required env vars are set!${NC}"
        echo ""

        # Deploy
        echo -e "${GREEN}Pushing to Heroku...${NC}"
        BRANCH=$(git rev-parse --abbrev-ref HEAD)

        if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
            git push heroku "$BRANCH"
        else
            git push heroku "$BRANCH":main
        fi

        # Restart
        echo -e "${GREEN}Restarting...${NC}"
        heroku restart -a "$APP_NAME"

        # Show status
        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        APP_URL=$(heroku apps:info -a "$APP_NAME" --json | grep -o '"web_url":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}🌐 App URL: ${APP_URL}${NC}"
        echo -e "${GREEN}🔍 Health: ${APP_URL}api/health${NC}"
        echo ""
        echo -e "${YELLOW}View logs:${NC} heroku logs --tail -a $APP_NAME"
        ;;

    2)
        echo -e "${GREEN}🐳 Building Docker image...${NC}"
        echo ""

        read -p "Enter image name [pick-up-be]: " IMAGE_NAME
        IMAGE_NAME=${IMAGE_NAME:-pick-up-be}

        # Build
        echo -e "${YELLOW}Building image...${NC}"
        docker build -t "$IMAGE_NAME" .

        echo ""
        echo -e "${GREEN}✅ Docker image built: $IMAGE_NAME${NC}"
        echo ""
        echo -e "${YELLOW}To run locally:${NC}"
        echo "docker run -p 3000:3000 --env-file .env $IMAGE_NAME"
        echo ""
        echo -e "${YELLOW}To push to registry:${NC}"
        echo "docker tag $IMAGE_NAME your-registry/$IMAGE_NAME"
        echo "docker push your-registry/$IMAGE_NAME"
        ;;

    3)
        echo -e "${GREEN}🔨 Building project...${NC}"
        echo ""

        # Install dependencies
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install --ignore-scripts

        # Generate Prisma client
        echo -e "${YELLOW}Generating Prisma client...${NC}"
        npx prisma generate || {
            echo -e "${YELLOW}Warning: Prisma generate failed (may be due to network issues)${NC}"
            echo -e "${YELLOW}Attempting to continue with existing client...${NC}"
        }

        # Build
        echo -e "${YELLOW}Running TypeScript compiler...${NC}"
        npm run build

        echo ""
        echo -e "${GREEN}✅ Build complete!${NC}"
        echo -e "${GREEN}Output: ./dist${NC}"
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
