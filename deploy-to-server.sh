#!/bin/bash

# Deploy to External Server Script
echo "🚀 Preparing files for external server deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Create deployment package
DEPLOY_DIR="order-cost-calculator-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

print_info "Creating deployment package..."

# Copy essential files
cp docker-compose.yml $DEPLOY_DIR/
cp -r frontend/ $DEPLOY_DIR/
cp -r backend/ $DEPLOY_DIR/
cp -r docker-data/ $DEPLOY_DIR/
mkdir -p $DEPLOY_DIR/logs

print_status "Files copied"

# Create server setup script
cat > $DEPLOY_DIR/setup-server.sh << 'EOF'
#!/bin/bash

echo "🚀 Setting up Order Cost Calculator on server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed. Please logout and login again, then run this script."
    exit 1
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Start application
echo "Starting Order Cost Calculator..."
docker-compose up -d --build

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application is running:"
echo "  • Frontend: http://$(curl -s ifconfig.me):3001"
echo "  • Backend API: http://$(curl -s ifconfig.me):8082"
echo ""
echo "🔐 Login credentials:"
echo "  • Username: Chaitanya"
echo "  • Password: Test123"
echo ""
echo "📋 Management commands:"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop: docker-compose down"
echo "  • Restart: docker-compose restart"
echo "  • Update: docker-compose pull && docker-compose up -d"
EOF

chmod +x $DEPLOY_DIR/setup-server.sh

# Create quick start guide
cat > $DEPLOY_DIR/README.md << 'EOF'
# Order Cost Calculator - Server Deployment

## Quick Start

1. **Upload this folder to your server**
2. **Run the setup script:**
   ```bash
   ./setup-server.sh
   ```

## Manual Setup

If you prefer manual setup:

```bash
# Install Docker and Docker Compose
sudo apt update
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start the application
docker-compose up -d --build
```

## Access Your Application

- **Frontend:** http://YOUR_SERVER_IP:3001
- **Backend API:** http://YOUR_SERVER_IP:8082

## Login Credentials

- **Username:** Chaitanya
- **Password:** Test123

## Domain Setup (Optional)

To use a custom domain:

1. Point your domain to server IP
2. Update CORS settings in docker-compose.yml
3. Set up reverse proxy (nginx) for SSL

## Firewall Setup

Make sure these ports are open:
- Port 3001 (Frontend)
- Port 8082 (Backend API)
- Port 22 (SSH)

## Support Commands

```bash
# View application logs
docker-compose logs -f

# Stop application
docker-compose down

# Restart application
docker-compose restart

# Update application
docker-compose pull
docker-compose up -d
```

## Security Notes

- Change default JWT secret in production
- Set up SSL certificate for HTTPS
- Consider using environment variables for sensitive data
- Regular backups of docker-data/ directory
EOF

# Create zip package
print_info "Creating deployment package..."
zip -r "${DEPLOY_DIR}.zip" $DEPLOY_DIR/
print_status "Deployment package created: ${DEPLOY_DIR}.zip"

echo ""
print_info "📦 Deployment Options:"
echo ""
echo "1️⃣  **Upload to Server:**"
echo "   • Upload ${DEPLOY_DIR}.zip to your server"
echo "   • Extract: unzip ${DEPLOY_DIR}.zip"
echo "   • Run: cd $DEPLOY_DIR && ./setup-server.sh"
echo ""
echo "2️⃣  **Cloud Platforms:**"
echo "   • DigitalOcean: Create droplet, upload files"
echo "   • AWS EC2: Launch instance, upload files"
echo "   • Google Cloud: Create VM, upload files"
echo ""
echo "3️⃣  **Required Server Specs:**"
echo "   • 2GB RAM minimum (4GB recommended)"
echo "   • 20GB disk space"
echo "   • Ubuntu 20.04+ or similar"
echo ""
print_warning "Remember to:"
echo "   • Open ports 3001 and 8082 in firewall"
echo "   • Point your domain to server IP (optional)"
echo "   • Set up SSL certificate for production"

rm -rf $DEPLOY_DIR
