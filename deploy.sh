#!/bin/bash
# One-shot deployment script for pick-up-be backend
# Supports both Heroku and Docker deployments
# Database is managed by Supabase (no migrations needed)
#
# Usage:
#   ./deploy.sh                          # Interactive mode
#   ./deploy.sh --sync-env               # Auto-sync .env to Heroku (skip existing)
#   ./deploy.sh --overwrite-env         # Auto-sync .env to Heroku (overwrite existing)
#   ./deploy.sh --env-file .env.prod    # Use custom .env file
#
# Options:
#   --env-file <path>    Specify custom .env file (default: .env)
#   --sync-env          Automatically sync .env variables to Heroku
#   --overwrite-env     Sync .env variables and overwrite existing ones

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to load environment variables from .env file
load_env_file() {
    local env_file="${1:-.env}"
    
    if [ ! -f "$env_file" ]; then
        return 1
    fi
    
    # Read .env file and export variables (handles comments and empty lines)
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Remove leading/trailing whitespace
        line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        # Skip if line doesn't contain =
        [[ ! "$line" =~ = ]] && continue
        
        # Extract key and value
        key=$(echo "$line" | cut -d'=' -f1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$line" | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        # Remove quotes if present
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # Export variable
        export "$key=$value"
    done < "$env_file"
    
    return 0
}

# Function to sync .env variables to Heroku
sync_env_to_heroku() {
    local app_name=$1
    local env_file="${2:-.env}"
    local overwrite=${3:-false}
    
    if [ ! -f "$env_file" ]; then
        echo -e "${YELLOW}No .env file found at $env_file${NC}"
        return 1
    fi
    
    echo -e "${CYAN}Reading environment variables from $env_file...${NC}"
    
    local vars_to_set=()
    local vars_to_skip=()
    
    # Read .env file
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Remove leading/trailing whitespace
        line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        # Skip if line doesn't contain =
        [[ ! "$line" =~ = ]] && continue
        
        # Extract key and value
        key=$(echo "$line" | cut -d'=' -f1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$line" | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        # Skip empty keys
        [[ -z "$key" ]] && continue
        
        # Remove quotes if present
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # Auto-add SSL parameters for Supabase database URLs if missing
        if [[ "$key" == "DATABASE_URL" || "$key" == "DIRECT_URL" ]]; then
            if [[ "$value" == *"supabase.co"* ]] && [[ "$value" != *"sslmode="* ]]; then
                separator="?"
                [[ "$value" == *"?"* ]] && separator="&"
                value="${value}${separator}sslmode=require&connect_timeout=10"
                echo -e "${YELLOW}  → Added SSL parameters to $key${NC}"
            fi
        fi
        
        # Check if variable already exists in Heroku
        existing_value=$(heroku config:get "$key" -a "$app_name" 2>/dev/null || echo "")
        
        if [ -n "$existing_value" ] && [ "$overwrite" != "true" ]; then
            vars_to_skip+=("$key")
        else
            vars_to_set+=("$key=$value")
        fi
    done < "$env_file"
    
    if [ ${#vars_to_skip[@]} -gt 0 ]; then
        echo -e "${YELLOW}Variables already set (skipping):${NC}"
        printf '  %s\n' "${vars_to_skip[@]}"
        echo ""
    fi
    
    if [ ${#vars_to_set[@]} -eq 0 ]; then
        echo -e "${GREEN}All variables are already set!${NC}"
        return 0
    fi
    
    echo -e "${CYAN}Setting ${#vars_to_set[@]} environment variable(s)...${NC}"
    
    # Set variables in batches (Heroku has limits)
    local batch=()
    local batch_size=0
    
    for var_pair in "${vars_to_set[@]}"; do
        batch+=("$var_pair")
        ((batch_size++))
        
        # Set in batches of 10
        if [ $batch_size -ge 10 ]; then
            heroku config:set "${batch[@]}" -a "$app_name" > /dev/null
            batch=()
            batch_size=0
        fi
    done
    
    # Set remaining variables
    if [ ${#batch[@]} -gt 0 ]; then
        heroku config:set "${batch[@]}" -a "$app_name" > /dev/null
    fi
    
    echo -e "${GREEN}✅ Environment variables synced!${NC}"
    return 0
}

echo -e "${GREEN}🚀 Pick-Up Backend Deployment${NC}"
echo ""

# Parse command line arguments
ENV_FILE=".env"
AUTO_SYNC_ENV=false
OVERWRITE_ENV=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --sync-env)
            AUTO_SYNC_ENV=true
            shift
            ;;
        --overwrite-env)
            AUTO_SYNC_ENV=true
            OVERWRITE_ENV=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

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

        # Sync environment variables from .env file
        if [ -f "$ENV_FILE" ]; then
            echo ""
            if [ "$AUTO_SYNC_ENV" = true ]; then
                echo -e "${CYAN}Auto-syncing environment variables from $ENV_FILE...${NC}"
                sync_env_to_heroku "$APP_NAME" "$ENV_FILE" "$OVERWRITE_ENV"
                echo ""
            else
                echo -e "${CYAN}Found $ENV_FILE file. Sync environment variables?${NC}"
                echo "1) Yes, sync all variables"
                echo "2) Yes, sync and overwrite existing"
                echo "3) No, skip"
                read -p "Enter choice [1-3]: " sync_choice
                
                case $sync_choice in
                    1)
                        sync_env_to_heroku "$APP_NAME" "$ENV_FILE" false
                        ;;
                    2)
                        sync_env_to_heroku "$APP_NAME" "$ENV_FILE" true
                        ;;
                    3)
                        echo -e "${YELLOW}Skipping environment variable sync...${NC}"
                        ;;
                    *)
                        echo -e "${YELLOW}Invalid choice, skipping...${NC}"
                        ;;
                esac
                echo ""
            fi
        else
            echo -e "${YELLOW}No .env file found at $ENV_FILE. Skipping environment variable sync...${NC}"
            echo ""
        fi

        # Check environment variables
        echo -e "${YELLOW}Checking required environment variables...${NC}"
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
            echo -e "${YELLOW}Options:${NC}"
            echo "1) Set them manually: heroku config:set KEY=value -a $APP_NAME"
            echo "2) Run setup script: ./scripts/setup-heroku-env.sh $APP_NAME"
            echo "3) Sync from .env file (if available)"
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
        
        # Check if app is running
        echo -e "${YELLOW}Checking app status...${NC}"
        sleep 3
        if heroku ps -a "$APP_NAME" | grep -q "web.1.*up"; then
            echo -e "${GREEN}✅ App is running!${NC}"
        else
            echo -e "${RED}⚠️  App may not be running. Check logs:${NC}"
            echo "heroku logs --tail -a $APP_NAME"
        fi
        
        echo ""
        echo -e "${YELLOW}Useful commands:${NC}"
        echo "  View logs:     heroku logs --tail -a $APP_NAME"
        echo "  Check status:  heroku ps -a $APP_NAME"
        echo "  View config:   heroku config -a $APP_NAME"
        echo "  Restart:       heroku restart -a $APP_NAME"
        echo "  Run console:  heroku run bash -a $APP_NAME"
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
