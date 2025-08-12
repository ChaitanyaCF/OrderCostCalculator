#!/bin/bash

# Deploy to Kubernetes with Local Database
echo "🚀 Deploying Order Cost Calculator to Kubernetes with your database..."

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

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Step 1: Build Docker images
print_info "Building Docker images..."
docker compose build
print_status "Docker images built"

# Step 2: Create namespace
print_info "Creating Kubernetes namespace..."
kubectl apply -f k8s/namespace.yaml
print_status "Namespace created"

# Step 3: Prepare database for Kubernetes
print_info "Preparing database for Kubernetes deployment..."
mkdir -p ./k8s-data
if [ -f "./docker-data/procostdb_new.mv.db" ]; then
    cp "./docker-data/procostdb_new.mv.db" "./k8s-data/procostdb_new.mv.db"
    print_status "Database copied for Kubernetes deployment"
else
    print_error "Database not found at ./docker-data/procostdb_new.mv.db"
    print_info "Run './deploy-with-local-db.sh' first to prepare the database"
    exit 1
fi

# Step 4: Create ConfigMap and PVC
print_info "Applying Kubernetes configurations..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/pvc.yaml
print_status "ConfigMaps and PVC created"

# Step 5: Wait for PVC to be bound
print_info "Waiting for Persistent Volume Claim to be ready..."
kubectl wait --for=condition=Bound pvc/backend-data-pvc -n order-cost-calculator --timeout=60s
print_status "PVC is ready"

# Step 6: Copy database to PVC using a temporary pod
print_info "Copying database to Kubernetes storage..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: database-copy-pod
  namespace: order-cost-calculator
spec:
  containers:
  - name: copy-container
    image: busybox
    command: ["sleep", "3600"]
    volumeMounts:
    - name: data-volume
      mountPath: /app/data
  volumes:
  - name: data-volume
    persistentVolumeClaim:
      claimName: backend-data-pvc
  restartPolicy: Never
EOF

# Wait for pod to be ready
kubectl wait --for=condition=Ready pod/database-copy-pod -n order-cost-calculator --timeout=60s

# Copy database file
kubectl cp ./k8s-data/procostdb_new.mv.db order-cost-calculator/database-copy-pod:/app/data/procostdb_new.mv.db

# Delete the temporary pod
kubectl delete pod database-copy-pod -n order-cost-calculator
print_status "Database copied to Kubernetes storage"

# Step 7: Deploy backend and frontend
print_info "Deploying backend and frontend..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
print_status "Deployments created"

# Step 8: Apply ingress and HPA
print_info "Setting up ingress and autoscaling..."
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
print_status "Ingress and HPA configured"

# Step 9: Wait for deployments to be ready
print_info "Waiting for deployments to be ready..."
kubectl wait --for=condition=Available deployment/backend-deployment -n order-cost-calculator --timeout=300s
kubectl wait --for=condition=Available deployment/frontend-deployment -n order-cost-calculator --timeout=300s
print_status "All deployments are ready"

# Step 10: Show status
echo ""
print_status "🎉 Deployment complete!"
echo ""
print_info "Kubernetes Resources:"
echo "  • Namespace: order-cost-calculator"
echo "  • Backend Deployment: backend-deployment"
echo "  • Frontend Deployment: frontend-deployment"
echo "  • Persistent Volume: backend-data-pvc"
echo ""

# Get service information
print_info "Service Information:"
kubectl get services -n order-cost-calculator

echo ""
print_info "To access your application:"
echo "  • Port forward: kubectl port-forward svc/frontend-service 3001:3000 -n order-cost-calculator"
echo "  • Or configure your ingress domain in k8s/ingress.yaml"
echo ""

print_info "To check logs:"
echo "  • Backend: kubectl logs -f deployment/backend-deployment -n order-cost-calculator"
echo "  • Frontend: kubectl logs -f deployment/frontend-deployment -n order-cost-calculator"
echo ""

print_info "Your database with user 'Chaitanya' is now deployed in Kubernetes!"
echo "  • Login: Chaitanya / Test123"

# Clean up
rm -rf ./k8s-data
print_status "Cleanup completed"
