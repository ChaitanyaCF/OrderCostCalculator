# Order Cost Calculator - Deployment Package

## 🚀 Quick Deployment Guide

This package contains everything needed to deploy the Order Cost Calculator to Kubernetes.

## 📁 Package Contents

```
deployment-package/
├── README-QUICK-START.md          # This file
├── DEPLOYMENT.md                  # Complete deployment guide
├── deploy.sh                      # Automated deployment script
├── backend-Dockerfile             # Backend container definition
├── frontend-Dockerfile            # Frontend container definition
├── fullstack-Dockerfile           # Single container option
├── nginx.conf                     # Nginx configuration for frontend
└── k8s/                          # Kubernetes manifests
    ├── namespace.yaml             # Application namespace
    ├── configmap.yaml             # Configuration settings
    ├── backend-deployment.yaml    # Backend service & deployment
    ├── frontend-deployment.yaml   # Frontend service & deployment
    ├── pvc.yaml                   # Persistent storage
    ├── ingress.yaml               # External access routing
    ├── hpa.yaml                   # Auto-scaling configuration
    └── production.env             # Environment variables
```

## ⚡ Quick Start (5 minutes)

### Prerequisites
- Kubernetes cluster running
- kubectl configured and connected
- Docker installed
- Ingress controller in your cluster

### Step 1: Extract and Prepare
```bash
# Extract the package to your desired location
cd /path/to/deployment-package

# Make deployment script executable
chmod +x deploy.sh
```

### Step 2: Configure (Optional)
```bash
# Edit domain and settings
vim k8s/ingress.yaml          # Update your-domain.com
vim k8s/production.env        # Update environment variables
```

### Step 3: Deploy
```bash
# Deploy everything with one command
./deploy.sh
```

### Step 4: Access
```bash
# Check deployment status
kubectl get pods -n order-cost-calculator

# Access via port-forward (for testing)
kubectl port-forward service/frontend-service 3000:3000 -n order-cost-calculator

# Then open: http://localhost:3000
```

## 🔧 Manual Deployment

If you prefer manual control:

```bash
# 1. Build Docker images (place Dockerfiles in respective directories)
docker build -t order-cost-calculator-backend:latest -f backend-Dockerfile ./path/to/backend
docker build -t order-cost-calculator-frontend:latest -f frontend-Dockerfile ./path/to/frontend

# 2. Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

## 🌐 Production Setup

### Domain Configuration
1. Update `k8s/ingress.yaml` - replace `your-domain.com` with your actual domain
2. Configure DNS to point to your cluster's ingress IP
3. Setup TLS certificates for HTTPS

### Resource Sizing
Adjust resources in deployment files based on your needs:
- **Small**: 1 CPU, 1GB RAM (current config)
- **Medium**: 2 CPU, 2GB RAM
- **Large**: 4 CPU, 4GB RAM

### Database
- **Development**: Uses H2 (included)
- **Production**: Configure external PostgreSQL/MySQL in ConfigMap

## 🔍 Verification

```bash
# Check all components
kubectl get all -n order-cost-calculator

# View logs
kubectl logs -f deployment/backend-deployment -n order-cost-calculator
kubectl logs -f deployment/frontend-deployment -n order-cost-calculator

# Test health endpoints
kubectl port-forward service/backend-service 8082:8082 -n order-cost-calculator
curl http://localhost:8082/actuator/health
```

## 🧹 Cleanup

```bash
# Remove everything
kubectl delete namespace order-cost-calculator

# Remove local images
docker rmi order-cost-calculator-backend:latest
docker rmi order-cost-calculator-frontend:latest
```

## 📞 Support

- Read `DEPLOYMENT.md` for detailed documentation
- Check Kubernetes events: `kubectl get events -n order-cost-calculator`
- View pod status: `kubectl describe pod <pod-name> -n order-cost-calculator`

## 🎯 Common Issues

**Pods not starting**: Check `kubectl describe pod <pod-name>`
**Ingress not working**: Verify ingress controller is installed
**Database errors**: Check PVC is bound and mounted
**Image pull errors**: Ensure images are built locally or pushed to registry

---
**Deployment Package Version**: Latest
**Compatible with**: Kubernetes 1.24+
**Architecture**: Multi-service with persistent storage
