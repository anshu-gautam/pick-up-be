#!/bin/bash
# fix-heroku-config.sh - Fix Redis and Database configuration on Heroku
# Usage: ./scripts/fix-heroku-config.sh [app-name]

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

echo -e "${GREEN}🔧 Fixing Heroku configuration for: $APP_NAME${NC}"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}Error: Heroku CLI not installed${NC}"
    exit 1
fi

# 1. Fix Redis
echo -e "${CYAN}1. Checking Redis configuration...${NC}"
REDIS_URL=$(heroku config:get REDIS_URL -a "$APP_NAME" 2>/dev/null || echo "")
REDIS_TLS_URL=$(heroku config:get REDIS_TLS_URL -a "$APP_NAME" 2>/dev/null || echo "")

if [ -z "$REDIS_URL" ] && [ -z "$REDIS_TLS_URL" ]; then
    echo -e "${YELLOW}   Redis addon not found or not provisioned.${NC}"
    echo -e "${YELLOW}   Adding Heroku Redis addon...${NC}"
    heroku addons:create heroku-redis:mini -a "$APP_NAME" || {
        echo -e "${YELLOW}   Addon may already exist or provisioning in progress...${NC}"
    }
    echo -e "${GREEN}   ✓ Redis addon will set REDIS_URL automatically${NC}"
else
    # Check if Redis URL needs protocol fix (Upstash URLs sometimes missing protocol)
    if [[ "$REDIS_URL" == //* ]] || [[ "$REDIS_TLS_URL" == //* ]]; then
        echo -e "${YELLOW}   Fixing Redis URL (adding protocol)...${NC}"
        if [[ "$REDIS_URL" == //* ]]; then
            FIXED_URL="rediss:${REDIS_URL}"
            heroku config:set "REDIS_URL=$FIXED_URL" -a "$APP_NAME"
            echo -e "${GREEN}   ✓ Fixed REDIS_URL protocol${NC}"
        fi
        if [[ "$REDIS_TLS_URL" == //* ]]; then
            FIXED_TLS_URL="rediss:${REDIS_TLS_URL}"
            heroku config:set "REDIS_TLS_URL=$FIXED_TLS_URL" -a "$APP_NAME"
            echo -e "${GREEN}   ✓ Fixed REDIS_TLS_URL protocol${NC}"
        fi
    else
        echo -e "${GREEN}   ✓ Redis URL is configured${NC}"
    fi
fi
echo ""

# 2. Fix Database URL with SSL
echo -e "${CYAN}2. Fixing DATABASE_URL with SSL parameters...${NC}"
CURRENT_DB_URL=$(heroku config:get DATABASE_URL -a "$APP_NAME" 2>/dev/null || echo "")

if [ -z "$CURRENT_DB_URL" ]; then
    echo -e "${RED}   Error: DATABASE_URL not found in Heroku config${NC}"
    echo -e "${YELLOW}   Please set it manually or use ./deploy.sh --sync-env${NC}"
else
    if [[ "$CURRENT_DB_URL" == *"supabase.co"* ]]; then
        # Check if using direct connection (port 5432) - suggest connection pooling
        if [[ "$CURRENT_DB_URL" == *":5432/"* ]]; then
            echo -e "${YELLOW}   ⚠️  Using direct connection (port 5432). Consider connection pooling (port 6543) for better reliability.${NC}"
            read -p "   Switch to connection pooling? (y/n) [y]: " use_pooling
            use_pooling=${use_pooling:-y}
            
            if [[ "$use_pooling" == "y" ]]; then
                # Switch to connection pooling
                NEW_DB_URL="${CURRENT_DB_URL//:5432\//:6543/}"
                separator="?"
                [[ "$NEW_DB_URL" == *"?"* ]] && separator="&"
                if [[ "$NEW_DB_URL" != *"sslmode="* ]]; then
                    NEW_DB_URL="${NEW_DB_URL}${separator}sslmode=require&connect_timeout=10&pgbouncer=true"
                elif [[ "$NEW_DB_URL" != *"pgbouncer="* ]]; then
                    NEW_DB_URL="${NEW_DB_URL}${separator}pgbouncer=true"
                fi
                
                echo -e "${YELLOW}   Updating DATABASE_URL to use connection pooling...${NC}"
                heroku config:set "DATABASE_URL=$NEW_DB_URL" -a "$APP_NAME"
                echo -e "${GREEN}   ✓ DATABASE_URL updated to use connection pooling (port 6543)${NC}"
            else
                # Just add SSL if missing
                if [[ "$CURRENT_DB_URL" != *"sslmode="* ]]; then
                    separator="?"
                    [[ "$CURRENT_DB_URL" == *"?"* ]] && separator="&"
                    NEW_DB_URL="${CURRENT_DB_URL}${separator}sslmode=require&connect_timeout=10"
                    
                    echo -e "${YELLOW}   Updating DATABASE_URL with SSL parameters...${NC}"
                    heroku config:set "DATABASE_URL=$NEW_DB_URL" -a "$APP_NAME"
                    echo -e "${GREEN}   ✓ DATABASE_URL updated with SSL${NC}"
                else
                    echo -e "${GREEN}   ✓ DATABASE_URL already has SSL parameters${NC}"
                fi
            fi
        elif [[ "$CURRENT_DB_URL" == *"sslmode="* ]]; then
            echo -e "${GREEN}   ✓ DATABASE_URL already has SSL parameters${NC}"
        else
            # Add SSL if missing
            separator="?"
            [[ "$CURRENT_DB_URL" == *"?"* ]] && separator="&"
            NEW_DB_URL="${CURRENT_DB_URL}${separator}sslmode=require&connect_timeout=10"
            
            echo -e "${YELLOW}   Updating DATABASE_URL with SSL parameters...${NC}"
            heroku config:set "DATABASE_URL=$NEW_DB_URL" -a "$APP_NAME"
            echo -e "${GREEN}   ✓ DATABASE_URL updated with SSL${NC}"
        fi
    else
        echo -e "${YELLOW}   ⚠️  DATABASE_URL doesn't appear to be a Supabase URL${NC}"
    fi
fi
echo ""

# 3. Fix DIRECT_URL with SSL
echo -e "${CYAN}3. Fixing DIRECT_URL with SSL parameters...${NC}"
CURRENT_DIRECT_URL=$(heroku config:get DIRECT_URL -a "$APP_NAME" 2>/dev/null || echo "")

if [ -z "$CURRENT_DIRECT_URL" ]; then
    echo -e "${YELLOW}   DIRECT_URL not found. Setting to DATABASE_URL value...${NC}"
    UPDATED_DB_URL=$(heroku config:get DATABASE_URL -a "$APP_NAME" 2>/dev/null || echo "")
    if [ -n "$UPDATED_DB_URL" ]; then
        heroku config:set "DIRECT_URL=$UPDATED_DB_URL" -a "$APP_NAME"
        echo -e "${GREEN}   ✓ DIRECT_URL set to DATABASE_URL${NC}"
    fi
else
    if [[ "$CURRENT_DIRECT_URL" == *"supabase.co"* ]] && [[ "$CURRENT_DIRECT_URL" != *"sslmode="* ]]; then
        # Add SSL parameters
        separator="?"
        [[ "$CURRENT_DIRECT_URL" == *"?"* ]] && separator="&"
        NEW_DIRECT_URL="${CURRENT_DIRECT_URL}${separator}sslmode=require&connect_timeout=10"
        
        echo -e "${YELLOW}   Updating DIRECT_URL with SSL parameters...${NC}"
        heroku config:set "DIRECT_URL=$NEW_DIRECT_URL" -a "$APP_NAME"
        echo -e "${GREEN}   ✓ DIRECT_URL updated with SSL${NC}"
    else
        if [[ "$CURRENT_DIRECT_URL" == *"sslmode="* ]]; then
            echo -e "${GREEN}   ✓ DIRECT_URL already has SSL parameters${NC}"
        else
            echo -e "${YELLOW}   ⚠️  DIRECT_URL doesn't appear to be a Supabase URL${NC}"
        fi
    fi
fi
echo ""

# 4. Restart app
echo -e "${CYAN}4. Restarting application...${NC}"
heroku restart -a "$APP_NAME"
echo -e "${GREEN}   ✓ Application restarted${NC}"
echo ""

echo -e "${GREEN}✅ Configuration fix complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Check logs: heroku logs --tail -a $APP_NAME"
echo "  2. Verify health: curl https://$APP_NAME.herokuapp.com/api/health"
echo ""

