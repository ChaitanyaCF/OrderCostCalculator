#!/bin/bash

# Deploy Order Cost Calculator to Kubernetes
# Includes conversation progression and enhanced features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Order Cost Calculator to Kubernetes${NC}"
echo "=============================================================="

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Kubernetes cluster is accessible${NC}"

# Get OpenAI API Key
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OpenAI API key not found in environment${NC}"
    read -p "Enter your OpenAI API key: " OPENAI_INPUT
    if [ -z "$OPENAI_INPUT" ]; then
        echo -e "${RED}❌ OpenAI API key is required for full functionality${NC}"
        exit 1
    fi
    OPENAI_API_KEY="$OPENAI_INPUT"
fi

echo -e "${GREEN}✅ OpenAI API key configured${NC}"

# Create namespace
echo -e "${BLUE}📦 Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

# Create secret with OpenAI API key
echo -e "${BLUE}🔐 Creating secrets...${NC}"
kubectl create secret generic order-cost-calculator-secrets \
    --namespace=order-cost-calculator \
    --from-literal=openai-api-key="$OPENAI_API_KEY" \
    --dry-run=client -o yaml | kubectl apply -f -

# Apply configurations
echo -e "${BLUE}⚙️  Applying configurations...${NC}"
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/pvc.yaml

# Deploy application
echo -e "${BLUE}🚀 Deploying application...${NC}"
kubectl apply -f k8s/app-deployment.yaml

# Apply networking
echo -e "${BLUE}🌐 Configuring networking...${NC}"
kubectl apply -f k8s/ingress.yaml

# Apply HPA (if available)
if [ -f "k8s/hpa.yaml" ]; then
    echo -e "${BLUE}📊 Configuring auto-scaling...${NC}"
    kubectl apply -f k8s/hpa.yaml
fi

# Wait for deployment
echo -e "${BLUE}⏳ Waiting for deployment to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/order-cost-calculator -n order-cost-calculator

# Get service status
echo -e "${BLUE}📋 Checking service status...${NC}"
kubectl get pods -n order-cost-calculator
kubectl get services -n order-cost-calculator

# Get external access information
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=============================================================="

# Check for LoadBalancer or NodePort services
LB_IP=$(kubectl get service order-cost-calculator-service -n order-cost-calculator -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
LB_HOSTNAME=$(kubectl get service order-cost-calculator-service -n order-cost-calculator -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ ! -z "$LB_IP" ]; then
    echo -e "${BLUE}🌐 External Access:${NC}"
    echo "   Frontend: http://$LB_IP:3000"
    echo "   Backend API: http://$LB_IP:8082"
elif [ ! -z "$LB_HOSTNAME" ]; then
    echo -e "${BLUE}🌐 External Access:${NC}"
    echo "   Frontend: http://$LB_HOSTNAME:3000"
    echo "   Backend API: http://$LB_HOSTNAME:8082"
else
    echo -e "${BLUE}🌐 Access via port-forward:${NC}"
    echo "   Frontend: kubectl port-forward -n order-cost-calculator svc/order-cost-calculator-service 3000:3000"
    echo "   Backend: kubectl port-forward -n order-cost-calculator svc/order-cost-calculator-service 8082:8082"
fi

echo ""
echo -e "${BLUE}🔧 Key Features Enabled:${NC}"
echo "   ✅ Conversation Progression"
echo "   ✅ Enhanced Email Processing" 
echo "   ✅ AI-Powered Classification"
echo "   ✅ Kubernetes Auto-scaling"
echo "   ✅ Persistent Storage"
echo "   ✅ Health Monitoring"
echo ""
echo -e "${BLUE}📊 Monitoring Commands:${NC}"
echo "   Logs: kubectl logs -f deployment/order-cost-calculator -n order-cost-calculator"
echo "   Status: kubectl get all -n order-cost-calculator"
echo "   Describe: kubectl describe deployment order-cost-calculator -n order-cost-calculator"
echo ""
echo -e "${YELLOW}💡 To delete: kubectl delete namespace order-cost-calculator${NC}"
