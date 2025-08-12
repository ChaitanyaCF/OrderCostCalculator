#!/bin/bash

# Local Docker Runner for Order Cost Calculator
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Running Order Cost Calculator Locally with Docker${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo -e "${YELLOW}Please install Docker Desktop from: https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again.${NC}"
    exit 1
fi

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Create data directory if it doesn't exist
mkdir -p data logs

print_status "Created data and logs directories"

# Choose deployment method
echo -e "${BLUE}Choose deployment method:${NC}"
echo "1) Docker Frontend + Local Backend (Recommended)"
echo "2) Full Docker Compose (Frontend + Backend in containers)"
read -p "Enter choice (1-2): " choice

case $choice in
    1)
        echo -e "${BLUE}🚀 Using Docker Frontend + Local Backend...${NC}"
        
        print_status "Starting backend using safe startup script..."
        
        # Run the backend startup script
        echo -e "${YELLOW}Running: cd /Users/chaitanyavallabhaneni/Downloads/OrderCostCalculator && chmod +x start-backend-safe.sh && ./start-backend-safe.sh${NC}"
        cd /Users/chaitanyavallabhaneni/Downloads/OrderCostCalculator
        chmod +x start-backend-safe.sh
        ./start-backend-safe.sh &
        
        print_status "Backend startup script initiated..."
        sleep 5
        
        # Check if docker-compose is available
        if command -v docker-compose &> /dev/null; then
            COMPOSE_CMD="docker-compose"
        elif docker compose version &> /dev/null; then
            COMPOSE_CMD="docker compose"
        else
            print_error "Docker Compose not found!"
            exit 1
        fi
        
        print_status "Building and starting frontend container..."
        $COMPOSE_CMD up --build -d frontend
        
        print_status "Waiting for services to start..."
        sleep 10
        
        # Check if services are healthy
        echo -e "${BLUE}🔍 Checking service health...${NC}"
        
        # Wait for backend to be ready
        echo "Waiting for backend to be ready..."
        for i in {1..30}; do
            if curl -f http://localhost:8082/ &> /dev/null 2>&1; then
                print_status "Backend is healthy!"
                break
            fi
            echo -n "."
            sleep 2
        done
        
        # Wait for frontend to be ready
        echo "Waiting for frontend to be ready..."
        for i in {1..15}; do
            if curl -f http://localhost:3001/ &> /dev/null 2>&1; then
                print_status "Frontend is healthy!"
                break
            fi
            echo -n "."
            sleep 2
        done
        
        ;;
    2)
        echo -e "${BLUE}🔧 Using Individual Containers...${NC}"
        
        # Create network
        docker network create order-cost-calculator-network 2>/dev/null || true
        print_status "Created Docker network"
        
        # Build and run backend
        print_status "Building backend image..."
        docker build -t order-cost-calculator-backend:latest -f backend/Dockerfile ./backend
        
        print_status "Starting backend container..."
        docker run -d \
            --name backend \
            --network order-cost-calculator-network \
            -p 8082:8082 \
            -v "$(pwd)/data:/app/data" \
            -v "$(pwd)/logs:/app/logs" \
            order-cost-calculator-backend:latest
        
        # Wait for backend
        sleep 15
        
        # Build and run frontend
        print_status "Building frontend image..."
        docker build -t order-cost-calculator-frontend:latest -f frontend/Dockerfile ./frontend
        
        print_status "Starting frontend container..."
        docker run -d \
            --name frontend \
            --network order-cost-calculator-network \
            -p 3000:3000 \
            order-cost-calculator-frontend:latest
        
        ;;
    3)
        echo -e "${BLUE}📦 Using Single Full-Stack Container...${NC}"
        
        print_status "Building full-stack image..."
        docker build -t order-cost-calculator:latest -f Dockerfile .
        
        print_status "Starting full-stack container..."
        docker run -d \
            --name order-cost-calculator \
            -p 3000:3000 \
            -p 8082:8082 \
            -v "$(pwd)/data:/app/data" \
            order-cost-calculator:latest
        
        ;;
    *)
        print_error "Invalid choice!"
        exit 1
        ;;
esac

sleep 5

# Show running containers
echo -e "${BLUE}📊 Running Containers:${NC}"
docker ps --filter "name=order-cost-calculator" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show access information
echo -e "${BLUE}🌐 Access Your Application:${NC}"
echo -e "${GREEN}Frontend (React App): http://localhost:3000${NC}"
echo -e "${GREEN}Backend API: http://localhost:8082${NC}"
echo -e "${GREEN}Health Check: http://localhost:8082/actuator/health${NC}"

# Show useful commands
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo "View logs:"
if [ "$choice" == "1" ]; then
    echo "  $COMPOSE_CMD logs -f backend"
    echo "  $COMPOSE_CMD logs -f frontend"
else
    echo "  docker logs -f backend"
    echo "  docker logs -f frontend"
fi

echo ""
echo "Stop containers:"
if [ "$choice" == "1" ]; then
    echo "  $COMPOSE_CMD down"
else
    echo "  docker stop backend frontend && docker rm backend frontend"
fi

echo ""
echo "Restart containers:"
if [ "$choice" == "1" ]; then
    echo "  $COMPOSE_CMD restart"
else
    echo "  docker restart backend frontend"
fi

print_status "Local deployment completed! 🎉"
print_warning "Note: Data will persist in the ./data directory"
