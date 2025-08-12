# Order Cost Calculator - Kubernetes Deployment Guide

This guide provides comprehensive instructions for deploying the Order Cost Calculator application to a Kubernetes cluster.

## 🏗️ Architecture Overview

The application consists of:
- **Frontend**: React application served by Nginx
- **Backend**: Spring Boot application with H2 database
- **Ingress**: Routes traffic to appropriate services
- **Persistent Storage**: For database and logs

## 📋 Prerequisites

### Required Tools
- Docker (v20.10+)
- kubectl (v1.24+)
- Kubernetes cluster (v1.24+)
- Ingress controller (Nginx recommended)

### Cluster Requirements
- **CPU**: Minimum 2 cores
- **Memory**: Minimum 4GB RAM
- **Storage**: 20GB available storage
- **Ingress Controller**: Nginx or Traefik

## 🚀 Quick Start

### 1. Clone and Prepare
```bash
git clone <your-repo>
cd OrderCostCalculator
```

### 2. Configure Environment
```bash
# Edit production configuration
cp k8s/production.env.example k8s/production.env
vim k8s/production.env
```

### 3. Deploy with Script
```bash
# Deploy latest version
./deploy.sh

# Deploy specific version
./deploy.sh v1.0.0
```

### 4. Access Application
```bash
# Via Ingress (production)
https://your-domain.com

# Via Port Forward (development)
kubectl port-forward service/frontend-service 3000:3000 -n order-cost-calculator
```

## 🔧 Manual Deployment

### Step 1: Build Docker Images
```bash
# Backend
docker build -t order-cost-calculator-backend:latest -f backend/Dockerfile ./backend

# Frontend
docker build -t order-cost-calculator-frontend:latest -f frontend/Dockerfile ./frontend

# Full-stack (optional)
docker build -t order-cost-calculator:latest -f Dockerfile .
```

### Step 2: Deploy to Kubernetes
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply configurations
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/pvc.yaml

# Deploy applications
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Configure autoscaling
kubectl apply -f k8s/hpa.yaml

# Setup ingress
kubectl apply -f k8s/ingress.yaml
```

### Step 3: Verify Deployment
```bash
# Check pods
kubectl get pods -n order-cost-calculator

# Check services
kubectl get services -n order-cost-calculator

# Check ingress
kubectl get ingress -n order-cost-calculator

# View logs
kubectl logs -f deployment/backend-deployment -n order-cost-calculator
kubectl logs -f deployment/frontend-deployment -n order-cost-calculator
```

## 🔒 Security Considerations

### Image Security
- All containers run as non-root users
- Read-only root filesystems where possible
- Minimal base images (Alpine Linux)
- Security contexts applied

### Network Security
- Network policies (optional)
- TLS termination at ingress
- CORS properly configured
- Internal service communication

### Secrets Management
```bash
# Create TLS secret
kubectl create secret tls order-cost-calculator-tls \
  --cert=path/to/cert.crt \
  --key=path/to/cert.key \
  -n order-cost-calculator

# Create database secret (if using external DB)
kubectl create secret generic db-credentials \
  --from-literal=username=dbuser \
  --from-literal=password=dbpass \
  -n order-cost-calculator
```

## 📊 Monitoring and Observability

### Health Checks
- **Frontend**: `GET /health`
- **Backend**: `GET /actuator/health`

### Metrics
- Application metrics exposed at `/actuator/metrics`
- Prometheus-compatible metrics
- Custom business metrics available

### Logging
```bash
# Application logs
kubectl logs -f deployment/backend-deployment -n order-cost-calculator

# Nginx access logs
kubectl logs -f deployment/frontend-deployment -n order-cost-calculator

# Stream logs with stern (if available)
stern backend -n order-cost-calculator
```

## 🔄 Scaling and Performance

### Manual Scaling
```bash
# Scale backend
kubectl scale deployment backend-deployment --replicas=5 -n order-cost-calculator

# Scale frontend
kubectl scale deployment frontend-deployment --replicas=3 -n order-cost-calculator
```

### Auto Scaling
HPA is configured to scale based on:
- CPU utilization (70%)
- Memory utilization (80%)
- Custom metrics (optional)

### Performance Tuning
```bash
# Backend JVM tuning
JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

# Nginx worker processes
worker_processes auto;
worker_connections 1024;
```

## 🔧 Configuration Management

### Environment Variables
Key configuration options:

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Spring profile | `production` |
| `JWT_SECRET` | JWT signing secret | `mySecretKey` |
| `JWT_EXPIRATION` | Token expiration (ms) | `86400000` |
| `JAVA_OPTS` | JVM options | See deployment |

### ConfigMap Updates
```bash
# Update configuration
kubectl edit configmap order-cost-calculator-config -n order-cost-calculator

# Restart deployments to pick up changes
kubectl rollout restart deployment/backend-deployment -n order-cost-calculator
kubectl rollout restart deployment/frontend-deployment -n order-cost-calculator
```

## 🗄️ Database Management

### H2 Database (Development)
- File-based H2 database
- Data persisted in PVC
- Console disabled in production

### External Database (Production)
For production, consider using:
- PostgreSQL
- MySQL
- Cloud database services

Example configuration:
```yaml
env:
- name: SPRING_DATASOURCE_URL
  value: "jdbc:postgresql://postgres-service:5432/order_cost_calculator"
- name: SPRING_DATASOURCE_USERNAME
  valueFrom:
    secretKeyRef:
      name: db-credentials
      key: username
- name: SPRING_DATASOURCE_PASSWORD
  valueFrom:
    secretKeyRef:
      name: db-credentials
      key: password
```

## 🔄 Updates and Rollbacks

### Rolling Updates
```bash
# Update backend image
kubectl set image deployment/backend-deployment backend=order-cost-calculator-backend:v2.0.0 -n order-cost-calculator

# Update frontend image
kubectl set image deployment/frontend-deployment frontend=order-cost-calculator-frontend:v2.0.0 -n order-cost-calculator

# Check rollout status
kubectl rollout status deployment/backend-deployment -n order-cost-calculator
```

### Rollbacks
```bash
# View rollout history
kubectl rollout history deployment/backend-deployment -n order-cost-calculator

# Rollback to previous version
kubectl rollout undo deployment/backend-deployment -n order-cost-calculator

# Rollback to specific revision
kubectl rollout undo deployment/backend-deployment --to-revision=2 -n order-cost-calculator
```

## 🧹 Cleanup

### Remove Application
```bash
# Delete namespace (removes everything)
kubectl delete namespace order-cost-calculator

# Or delete individual components
kubectl delete -f k8s/
```

### Remove Images
```bash
# Remove local images
docker rmi order-cost-calculator-backend:latest
docker rmi order-cost-calculator-frontend:latest
docker rmi order-cost-calculator:latest
```

## 🆘 Troubleshooting

### Common Issues

#### Pods Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n order-cost-calculator

# Check events
kubectl get events -n order-cost-calculator --sort-by='.lastTimestamp'
```

#### Database Connection Issues
```bash
# Check backend logs
kubectl logs deployment/backend-deployment -n order-cost-calculator

# Verify PVC is mounted
kubectl describe pvc backend-data-pvc -n order-cost-calculator
```

#### Ingress Not Working
```bash
# Check ingress status
kubectl describe ingress order-cost-calculator-ingress -n order-cost-calculator

# Verify ingress controller is running
kubectl get pods -n ingress-nginx
```

### Resource Issues
```bash
# Check resource usage
kubectl top pods -n order-cost-calculator
kubectl top nodes

# Check resource limits
kubectl describe deployment backend-deployment -n order-cost-calculator
```

## 📞 Support

For additional support:
1. Check application logs
2. Review Kubernetes events
3. Verify resource availability
4. Check network policies
5. Validate configurations

## 🔗 Useful Commands

```bash
# Quick status check
kubectl get all -n order-cost-calculator

# Port forwarding for local access
kubectl port-forward service/frontend-service 3000:3000 -n order-cost-calculator
kubectl port-forward service/backend-service 8082:8082 -n order-cost-calculator

# Debug pod
kubectl exec -it deployment/backend-deployment -n order-cost-calculator -- /bin/sh

# View resource usage
kubectl top pods -n order-cost-calculator

# Export configurations
kubectl get deployment backend-deployment -n order-cost-calculator -o yaml > backup-backend.yaml
```
