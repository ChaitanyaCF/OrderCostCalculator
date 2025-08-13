#!/bin/bash

# Deploy Order Cost Calculator with Docker Compose
# Includes conversation progression and enhanced features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Order Cost Calculator with Enhanced Features${NC}"
echo "=============================================================="

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are available${NC}"

# Check environment variables
echo -e "${BLUE}🔧 Checking environment configuration...${NC}"

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OpenAI API key not found in environment${NC}"
    read -p "Enter your OpenAI API key (or press Enter to continue without AI features): " OPENAI_INPUT
    if [ ! -z "$OPENAI_INPUT" ]; then
        export OPENAI_API_KEY="$OPENAI_INPUT"
        echo -e "${GREEN}✅ OpenAI API key configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Continuing without AI features${NC}"
    fi
else
    echo -e "${GREEN}✅ OpenAI API key found (${OPENAI_API_KEY:0:20}...)${NC}"
fi

# Prepare data directory
echo -e "${BLUE}📁 Preparing data directories...${NC}"
mkdir -p docker-data logs

# Copy existing database if available
if [ -f "backend/data/procostdb_new.mv.db" ]; then
    echo -e "${GREEN}📊 Copying existing database...${NC}"
    cp backend/data/procostdb_new.mv.db docker-data/
else
    echo -e "${YELLOW}ℹ️  No existing database found, will create new one${NC}"
fi

# Stop any existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true

# Build and start services
echo -e "${BLUE}🔨 Building application...${NC}"
docker-compose build --no-cache

echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 15

# Health check
echo -e "${BLUE}🏥 Performing health checks...${NC}"

# Check frontend
if curl -s http://localhost:3000/ > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

# Check backend
if curl -s http://localhost:8082/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:8082${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may still be starting up...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=============================================================="
echo -e "${BLUE}📊 Access your application:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8082"
echo "   Logs: docker-compose logs -f"
echo ""
echo -e "${BLUE}🔧 Key Features Enabled:${NC}"
echo "   ✅ Conversation Progression"
echo "   ✅ Enhanced Email Processing"
echo "   ✅ AI-Powered Classification"
echo "   ✅ Status Tracking"
echo "   ✅ Real-time Dashboard"
echo ""
echo -e "${BLUE}📧 For Zapier Integration:${NC}"
echo "   Use ngrok to expose: ngrok http 8082"
echo "   Webhook URL: https://your-ngrok-url.ngrok.app/api/zapier/receive-email"
echo ""
echo -e "${YELLOW}💡 To stop: docker-compose down${NC}"
