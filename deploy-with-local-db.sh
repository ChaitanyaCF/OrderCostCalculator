#!/bin/bash

# Deploy Local Database to Docker Script
echo "🚀 Deploying local database to Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Step 2: Stop any running backend processes
print_info "Stopping any running backend processes..."
if lsof -ti:8082 &> /dev/null; then
    lsof -ti:8082 | xargs kill -9
    print_status "Stopped local backend"
else
    print_info "No local backend running on port 8082"
fi

# Step 3: Stop Docker containers
print_info "Stopping Docker containers..."
docker compose down 2>/dev/null || true

# Step 4: Ensure data directory exists and copy database
print_info "Preparing database for Docker..."
mkdir -p ./docker-data

# Copy your working database to a Docker-specific location
if [ -f "./backend/data/procostdb_new.mv.db" ]; then
    cp "./backend/data/procostdb_new.mv.db" "./docker-data/procostdb_new.mv.db"
    print_status "Copied local database to Docker data directory"
else
    print_error "Local database not found at ./backend/data/procostdb_new.mv.db"
    exit 1
fi

# Step 5: Create Docker-specific application.properties
print_info "Creating Docker-specific configuration..."
cat > ./backend/application-docker.properties << 'EOF'
# Database Configuration for Docker
spring.datasource.url=jdbc:h2:file:/app/data/procostdb_new;AUTO_SERVER=TRUE
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
spring.h2.console.settings.web-allow-others=true

# SQL initialization - DISABLE for existing database
spring.sql.init.mode=never
spring.jpa.defer-datasource-initialization=false

# JWT Configuration
jwt.secret=mySecretKey
jwt.expirationMs=86400000

# Server Configuration
server.port=8082

# CORS Configuration
cors.allowed.origins=http://localhost:3000,http://localhost:3001,https://c452b228d0f0.ngrok-free.app,https://*.ngrok-free.app

# Logging - reduce verbosity for production
logging.level.org.springframework.web=INFO
logging.level.com.procost.api=INFO
logging.level.org.springframework.boot.autoconfigure=INFO

# Hybrid AI Configuration
ai.hybrid.enabled=true
ai.openai.fallback.enabled=true
ai.confidence.threshold=0.7

# OpenAI Configuration
openai.api.key=\${OPENAI_API_KEY:your-openai-api-key-here}
openai.model=gpt-4o-mini
openai.api.url=https://api.openai.com/v1/chat/completions
openai.temperature=0.1

# AI Processing Thresholds
ai.classification.confidence.threshold=0.8
ai.extraction.confidence.threshold=0.7
ai.parsing.confidence.threshold=0.6

# Fallback Behavior
ai.fallback.to.patterns=true
ai.retry.on.failure=true
ai.max.retries=3

# Performance Settings
ai.request.timeout=30000
ai.batch.processing=false
ai.cache.results=true

# Cost Control
ai.max.daily.requests=2000
ai.cost.alert.threshold=10.00
ai.usage.tracking.enabled=true
EOF

print_status "Created Docker-specific application.properties"

# Step 6: Update docker-compose.yml to use the correct database path
print_info "Updating Docker Compose configuration..."
cat > docker-compose-local-db.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: order-cost-calculator-backend:latest
    container_name: backend
    ports:
      - "8082:8082"
    volumes:
      - ./docker-data:/app/data
      - ./logs:/app/logs
      - ./backend/application-docker.properties:/app/application.properties
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - SPRING_DATASOURCE_URL=jdbc:h2:file:/app/data/procostdb_new;AUTO_SERVER=TRUE
      - SPRING_SQL_INIT_MODE=never
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    image: order-cost-calculator-frontend:latest
    container_name: frontend
    ports:
      - "3001:3000"
    depends_on:
      - backend
    environment:
      - NODE_ENV=production
      - REACT_APP_API_BASE_URL=http://localhost:8082
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    networks:
      - app-network

volumes:
  docker-data:
  logs:

networks:
  app-network:
    driver: bridge
EOF

print_status "Created Docker Compose configuration for local database"

# Step 7: Build and start containers
print_info "Building and starting Docker containers..."
docker compose -f docker-compose-local-db.yml up --build -d

# Step 8: Wait for services to start
print_info "Waiting for services to start..."
sleep 10

# Step 9: Test the deployment
print_info "Testing backend connection..."
for i in {1..30}; do
    if curl -f http://localhost:8082/ &> /dev/null 2>&1; then
        print_status "Backend is responding!"
        break
    fi
    echo -n "."
    sleep 2
done

print_info "Testing frontend connection..."
for i in {1..15}; do
    if curl -f http://localhost:3001/ &> /dev/null 2>&1; then
        print_status "Frontend is responding!"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
print_status "🎉 Deployment complete!"
echo ""
print_info "Your application is now running with your local database:"
echo "  • Frontend: http://localhost:3001"
echo "  • Backend:  http://localhost:8082"
echo "  • Login:    Chaitanya / Test123"
echo ""
print_info "To stop: docker compose -f docker-compose-local-db.yml down"
print_info "To restart: docker compose -f docker-compose-local-db.yml up -d"
