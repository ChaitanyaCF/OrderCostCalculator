#!/bin/bash

# Permanent Backend Startup Script for ProCost Application
# This script ensures the backend ALWAYS starts from the correct directory

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 ProCost Backend Startup Script${NC}"
echo "=================================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "Script location: $SCRIPT_DIR"
echo "Backend directory: $BACKEND_DIR"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ ERROR: Backend directory not found at $BACKEND_DIR${NC}"
    echo "Make sure you're running this script from the OrderCostCalculator root directory."
    exit 1
fi

# Change to the backend directory
cd "$BACKEND_DIR"
echo -e "${GREEN}✅ Changed to backend directory: $(pwd)${NC}"

# Verify we're in the correct directory by checking for pom.xml
if [ ! -f "pom.xml" ]; then
    echo -e "${RED}❌ ERROR: pom.xml not found in current directory!${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Verify the correct pom.xml (check for procost-api artifactId)
if ! grep -q "procost-api" pom.xml; then
    echo -e "${RED}❌ ERROR: Wrong pom.xml detected!${NC}"
    echo "This doesn't appear to be the backend pom.xml"
    exit 1
fi

echo -e "${GREEN}✅ Verified correct backend directory and pom.xml${NC}"

# Kill any existing backend processes
echo -e "${YELLOW}🔍 Checking for existing backend processes...${NC}"
if pgrep -f "com.procost.api.ProCostApplication" > /dev/null; then
    echo -e "${YELLOW}⚠️  Found existing backend process. Killing it...${NC}"
    pkill -f "com.procost.api.ProCostApplication"
    sleep 3
    echo -e "${GREEN}✅ Existing process terminated${NC}"
else
    echo -e "${GREEN}✅ No existing backend process found${NC}"
fi

# Check for any processes on port 8082
if lsof -i :8082 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 8082 is in use. Killing process...${NC}"
    lsof -ti :8082 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Verify database path in application.properties
echo -e "${YELLOW}🔍 Verifying database configuration...${NC}"
if grep -q "jdbc:h2:file:/Users/chaitanyavallabhaneni/Downloads/OrderCostCalculator/docker-data/procostdb_new" src/main/resources/application.properties; then
    echo -e "${GREEN}✅ Database path is correctly configured (Absolute Docker database path)${NC}"
else
    echo -e "${RED}❌ Database path may not be correctly configured${NC}"
    echo "Expected: jdbc:h2:file:/Users/chaitanyavallabhaneni/Downloads/OrderCostCalculator/docker-data/procostdb_new"
    echo "Current config in application.properties:"
    grep "spring.datasource.url" src/main/resources/application.properties || echo "Not found"
fi

# Display startup information
echo "=================================================="
echo -e "${GREEN}🔧 STARTUP CONFIGURATION:${NC}"
echo "Working Directory: $(pwd)"
echo "Maven Project: $(grep -A1 '<artifactId>' pom.xml | grep -v '<artifactId>spring-boot-starter-parent</artifactId>' | head -1 | sed 's/.*<artifactId>\(.*\)<\/artifactId>.*/\1/')"
echo "Database: H2 (file-based)"
echo "Port: 8082"
echo "=================================================="

# Start the backend with explicit directory settings
echo -e "${GREEN}🚀 Starting Maven Spring Boot application...${NC}"
echo "Command: mvn spring-boot:run -Dmaven.multiModuleProjectDirectory=\"$BACKEND_DIR\""

# Set OpenAI API key (you'll need to replace this with your actual key)
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OpenAI API key not set. AI processing will be disabled.${NC}"
    echo -e "${YELLOW}   To enable AI processing, set OPENAI_API_KEY environment variable${NC}"
    export OPENAI_API_KEY=""
fi

echo "=================================================="

# Start in foreground so we can see output
mvn spring-boot:run -Dmaven.multiModuleProjectDirectory="$BACKEND_DIR"

echo -e "${GREEN}✅ Backend startup script completed.${NC}"