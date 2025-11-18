#!/bin/bash
# setup-heroku-env.sh - Set up Heroku environment variables
# Usage: ./scripts/setup-heroku-env.sh [app-name]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_NAME=${1:-""}

if [ -z "$APP_NAME" ]; then
    echo -e "${YELLOW}Enter your Heroku app name:${NC}"
    read APP_NAME
fi

if [ -z "$APP_NAME" ]; then
    echo -e "${RED}Error: App name is required${NC}"
    exit 1
fi

echo -e "${GREEN}🔧 Setting up environment variables for: $APP_NAME${NC}"
echo ""

# Function to prompt for env var
set_env_var() {
    local var_name=$1
    local description=$2
    local default=$3
    local required=$4

    if [ -n "$default" ]; then
        echo -e "${CYAN}$var_name${NC} ($description) [default: $default]:"
    else
        echo -e "${CYAN}$var_name${NC} ($description):"
    fi

    read value

    if [ -z "$value" ] && [ -n "$default" ]; then
        value=$default
    fi

    if [ -z "$value" ] && [ "$required" = "true" ]; then
        echo -e "${RED}Error: $var_name is required${NC}"
        return 1
    fi

    if [ -n "$value" ]; then
        heroku config:set "$var_name=$value" -a "$APP_NAME"
        echo -e "${GREEN}✓ Set $var_name${NC}"
    fi
    echo ""
}

echo -e "${YELLOW}=== Basic Configuration ===${NC}"
echo ""

# Set NODE_ENV
heroku config:set NODE_ENV=production -a "$APP_NAME"
echo -e "${GREEN}✓ Set NODE_ENV=production${NC}"
echo ""

echo -e "${YELLOW}=== Supabase Configuration ===${NC}"
echo -e "Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/database"
echo ""

set_env_var "DATABASE_URL" "PostgreSQL connection string" "" "true"
set_env_var "DIRECT_URL" "Direct PostgreSQL connection (same as DATABASE_URL for Supabase)" "" "true"
set_env_var "SUPABASE_URL" "Supabase project URL (e.g., https://xxx.supabase.co)" "" "true"
set_env_var "SUPABASE_ANON_KEY" "Supabase anonymous key" "" "true"
set_env_var "SUPABASE_SERVICE_KEY" "Supabase service role key" "" "true"

echo -e "${YELLOW}=== OpenAI Configuration ===${NC}"
echo -e "Get your API key from: https://platform.openai.com/api-keys"
echo ""

set_env_var "OPENAI_API_KEY" "OpenAI API key" "" "true"
set_env_var "AI_MODEL" "OpenAI model to use" "gpt-4-turbo-preview" "false"

echo -e "${YELLOW}=== Clerk Authentication ===${NC}"
echo -e "Get these from: https://dashboard.clerk.com"
echo ""

set_env_var "CLERK_SECRET_KEY" "Clerk secret key" "" "true"
set_env_var "CLERK_PUBLISHABLE_KEY" "Clerk publishable key" "" "true"

echo -e "${YELLOW}=== CORS Configuration ===${NC}"
echo ""

set_env_var "CORS_ORIGIN" "Allowed origins (comma-separated or * for all)" "*" "false"

echo -e "${YELLOW}=== Rate Limiting ===${NC}"
echo ""

set_env_var "RATE_LIMIT_WINDOW_MS" "Rate limit window in ms" "900000" "false"
set_env_var "RATE_LIMIT_MAX_REQUESTS" "Max requests per window" "100" "false"

echo ""
echo -e "${GREEN}✅ Environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}Current configuration:${NC}"
heroku config -a "$APP_NAME"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy: ./scripts/deploy-heroku.sh $APP_NAME"
echo "2. Run migrations: heroku run npx prisma migrate deploy -a $APP_NAME"
echo "3. Test: curl https://$APP_NAME.herokuapp.com/api/health"
