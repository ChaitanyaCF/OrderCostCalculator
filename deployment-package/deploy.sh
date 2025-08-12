#!/bin/bash

# Order Cost Calculator Kubernetes Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="order-cost-calculator"
APP_NAME="order-cost-calculator"
DOCKER_REGISTRY="your-registry.com"  # Replace with your Docker registry
VERSION="${1:-latest}"

echo -e "${BLUE}🚀 Deploying Order Cost Calculator to Kubernetes${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"

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

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Build Docker images
echo -e "${BLUE}🔨 Building Docker images...${NC}"

# Build backend image
print_status "Building backend image..."
docker build -t ${DOCKER_REGISTRY}/${APP_NAME}-backend:${VERSION} -f backend/Dockerfile ./backend

# Build frontend image
print_status "Building frontend image..."
docker build -t ${DOCKER_REGISTRY}/${APP_NAME}-frontend:${VERSION} -f frontend/Dockerfile ./frontend

# Build full-stack image (optional)
print_status "Building full-stack image..."
docker build -t ${DOCKER_REGISTRY}/${APP_NAME}:${VERSION} -f Dockerfile .

# Push images to registry (uncomment if using external registry)
# echo -e "${BLUE}📤 Pushing images to registry...${NC}"
# docker push ${DOCKER_REGISTRY}/${APP_NAME}-backend:${VERSION}
# docker push ${DOCKER_REGISTRY}/${APP_NAME}-frontend:${VERSION}
# docker push ${DOCKER_REGISTRY}/${APP_NAME}:${VERSION}

# Deploy to Kubernetes
echo -e "${BLUE}☸️ Deploying to Kubernetes...${NC}"

# Create namespace
print_status "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMaps
print_status "Applying ConfigMaps..."
kubectl apply -f k8s/configmap.yaml

# Apply PVCs
print_status "Applying Persistent Volume Claims..."
kubectl apply -f k8s/pvc.yaml

# Deploy backend
print_status "Deploying backend..."
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
print_status "Deploying frontend..."
kubectl apply -f k8s/frontend-deployment.yaml

# Apply HPA
print_status "Applying Horizontal Pod Autoscalers..."
kubectl apply -f k8s/hpa.yaml

# Apply Ingress
print_status "Applying Ingress..."
kubectl apply -f k8s/ingress.yaml

# Wait for deployments to be ready
echo -e "${BLUE}⏳ Waiting for deployments to be ready...${NC}"

print_status "Waiting for backend deployment..."
kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n ${NAMESPACE}

print_status "Waiting for frontend deployment..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n ${NAMESPACE}

# Get deployment status
echo -e "${BLUE}📊 Deployment Status:${NC}"
kubectl get pods -n ${NAMESPACE}
kubectl get services -n ${NAMESPACE}
kubectl get ingress -n ${NAMESPACE}

# Get external IP/URL
echo -e "${BLUE}🌐 Access Information:${NC}"
INGRESS_IP=$(kubectl get ingress ${APP_NAME}-ingress -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
INGRESS_HOSTNAME=$(kubectl get ingress ${APP_NAME}-ingress -n ${NAMESPACE} -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "your-domain.com")

if [ "$INGRESS_IP" != "pending" ] && [ "$INGRESS_IP" != "" ]; then
    echo -e "${GREEN}Application URL: http://${INGRESS_IP}${NC}"
else
    echo -e "${YELLOW}Ingress IP pending. You can access via: http://${INGRESS_HOSTNAME}${NC}"
fi

# Port forwarding instructions
echo -e "${BLUE}🔗 Local access (if ingress not configured):${NC}"
echo -e "${YELLOW}Frontend: kubectl port-forward service/frontend-service 3000:3000 -n ${NAMESPACE}${NC}"
echo -e "${YELLOW}Backend:  kubectl port-forward service/backend-service 8082:8082 -n ${NAMESPACE}${NC}"

print_status "Deployment completed successfully!"

# Useful commands
echo -e "${BLUE}📝 Useful commands:${NC}"
echo "View logs:"
echo "  kubectl logs -f deployment/backend-deployment -n ${NAMESPACE}"
echo "  kubectl logs -f deployment/frontend-deployment -n ${NAMESPACE}"
echo ""
echo "Scale deployments:"
echo "  kubectl scale deployment backend-deployment --replicas=3 -n ${NAMESPACE}"
echo "  kubectl scale deployment frontend-deployment --replicas=3 -n ${NAMESPACE}"
echo ""
echo "Delete deployment:"
echo "  kubectl delete namespace ${NAMESPACE}"
