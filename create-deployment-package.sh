#!/bin/bash

# Create deployment package for Order Cost Calculator
# Includes all Docker and Kubernetes files with latest features

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}📦 Creating Order Cost Calculator Deployment Package${NC}"
echo "=============================================================="

# Create deployment directory
DEPLOY_DIR="order-cost-calculator-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

echo -e "${BLUE}📁 Packaging files...${NC}"

# Copy Docker files
cp Dockerfile "$DEPLOY_DIR/"
cp docker-compose.yml "$DEPLOY_DIR/"
cp deploy-local-docker.sh "$DEPLOY_DIR/"

# Copy Kubernetes files
mkdir -p "$DEPLOY_DIR/k8s"
cp k8s/*.yaml "$DEPLOY_DIR/k8s/"
cp deploy-kubernetes.sh "$DEPLOY_DIR/"

# Copy source code
echo -e "${BLUE}📋 Copying source code...${NC}"
mkdir -p "$DEPLOY_DIR/backend"
mkdir -p "$DEPLOY_DIR/frontend"

# Backend files
cp -r backend/src "$DEPLOY_DIR/backend/"
cp backend/pom.xml "$DEPLOY_DIR/backend/"

# Frontend files  
cp -r frontend/src "$DEPLOY_DIR/frontend/"
cp -r frontend/public "$DEPLOY_DIR/frontend/"
cp frontend/package*.json "$DEPLOY_DIR/frontend/"
cp frontend/nginx.conf "$DEPLOY_DIR/frontend/"

# Copy configuration files
cp .gitignore "$DEPLOY_DIR/"
cp DEPLOYMENT_GUIDE.md "$DEPLOY_DIR/"

# Create environment template
cat > "$DEPLOY_DIR/.env.template" << 'EOF'
# Order Cost Calculator Environment Configuration
# Copy this file to .env and configure your values

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=your-openai-api-key-here

# Database Configuration (Optional - defaults to H2)
# SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/procost
# SPRING_DATASOURCE_USERNAME=procost
# SPRING_DATASOURCE_PASSWORD=your-db-password

# Application Configuration
SPRING_PROFILES_ACTIVE=production
JAVA_OPTS=-XX:+UseContainerSupport -XX:MaxRAMPercentage=60.0

# Logging Configuration
LOGGING_LEVEL_COM_PROCOST_API_CONTROLLER_ZAPIERDATACONTROLLER=INFO
EOF

# Create README for deployment
cat > "$DEPLOY_DIR/README.md" << 'EOF'
# Order Cost Calculator - Deployment Package

## 🚀 Quick Start

### Docker Deployment (Recommended)
```bash
# 1. Set your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# 2. Deploy
./deploy-local-docker.sh
```

### Kubernetes Deployment
```bash
# 1. Deploy to cluster
./deploy-kubernetes.sh
```

## 📊 Features Included

- ✅ **Conversation Progression**: Email threading and status tracking
- ✅ **AI Integration**: OpenAI-powered email classification
- ✅ **Enhanced Dashboard**: Real-time enquiry and order management
- ✅ **Docker Support**: Full containerization with Docker Compose
- ✅ **Kubernetes Ready**: Production-ready K8s manifests
- ✅ **Health Monitoring**: Built-in health checks and logging

## 📖 Documentation

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 🆘 Support

For issues or questions:
1. Check the deployment guide
2. Review application logs
3. Test with provided curl commands

## 🏷️ Version

Built on: $(date)
Features: Conversation Progression, Enhanced Logging, AI Classification
EOF

# Make scripts executable
chmod +x "$DEPLOY_DIR"/*.sh

# Create archive
echo -e "${BLUE}🗜️  Creating archive...${NC}"
tar -czf "${DEPLOY_DIR}.tar.gz" "$DEPLOY_DIR"

# Cleanup
rm -rf "$DEPLOY_DIR"

echo ""
echo -e "${GREEN}✅ Deployment package created: ${DEPLOY_DIR}.tar.gz${NC}"
echo "=============================================================="
echo -e "${BLUE}📦 Package Contents:${NC}"
echo "   ✅ Docker files (Dockerfile, docker-compose.yml)"
echo "   ✅ Kubernetes manifests (k8s/*.yaml)"
echo "   ✅ Deployment scripts (deploy-*.sh)"
echo "   ✅ Complete source code (backend + frontend)"
echo "   ✅ Configuration templates"
echo "   ✅ Deployment documentation"
echo ""
echo -e "${BLUE}🚀 To deploy:${NC}"
echo "   1. Extract: tar -xzf ${DEPLOY_DIR}.tar.gz"
echo "   2. cd ${DEPLOY_DIR}"
echo "   3. Set OPENAI_API_KEY environment variable"
echo "   4. Run: ./deploy-local-docker.sh (or ./deploy-kubernetes.sh)"
echo ""
echo -e "${GREEN}📧 Ready for production deployment with conversation progression!${NC}"
