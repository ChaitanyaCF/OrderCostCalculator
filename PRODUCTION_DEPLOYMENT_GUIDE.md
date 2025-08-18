# Production Deployment Guide

## Overview

The Order Cost Calculator application is now fully configurable for production deployment. All URLs and domains can be configured via environment variables without code changes.

## Environment Variables

### Required Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI processing | None | `sk-proj-...` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:3000,http://localhost:3001` | `https://yourdomain.com,https://app.yourdomain.com` |
| `REACT_APP_API_URL` | Frontend API base URL | `http://localhost:8082` | `https://api.yourdomain.com` |
| `BACKEND_URL` | Backend URL for nginx proxy | `localhost:8082` | `localhost:8082` (same pod) or `backend.yourdomain.com` |

### Optional Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | Database connection URL | H2 file database |
| `JAVA_OPTS` | JVM options | Container optimized settings |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` |

## Deployment Scenarios

### 1. Docker Compose (Local/Development)

```bash
# Set environment variables
export OPENAI_API_KEY="your-openai-api-key"
export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
export REACT_APP_API_URL="http://localhost:8082"
export BACKEND_URL="localhost:8082"

# Deploy
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8082
- H2 Console: http://localhost:8082/h2-console (if enabled)

### 2. Docker Compose (Production)

```bash
# Set production environment variables
export OPENAI_API_KEY="your-openai-api-key"
export ALLOWED_ORIGINS="https://yourdomain.com"
export REACT_APP_API_URL="https://yourdomain.com"
export BACKEND_URL="localhost:8082"

# Deploy
docker-compose up -d
```

**Access:**
- Application: https://yourdomain.com

### 3. Kubernetes Deployment

#### Step 1: Update ConfigMap

Edit `k8s/configmap.yaml`:

```yaml
# URL Configuration (Update these for your production environment)
frontend.api.url: "https://yourdomain.com"  # Your production domain
cors.allowed.origins: "https://yourdomain.com"  # Your production domain
```

#### Step 2: Create Secret for OpenAI API Key

```bash
kubectl create secret generic openai-secret \
  --from-literal=api-key="your-openai-api-key" \
  -n order-cost-calculator
```

#### Step 3: Deploy

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n order-cost-calculator
kubectl get services -n order-cost-calculator
```

**Access:**
- Via Ingress: https://yourdomain.com
- Via NodePort: http://node-ip:30000

### 4. Single Docker Container

```bash
docker run -d \
  --name order-cost-calculator \
  -p 3000:3000 \
  -p 8082:8082 \
  -e OPENAI_API_KEY="your-openai-api-key" \
  -e ALLOWED_ORIGINS="https://yourdomain.com" \
  -e REACT_APP_API_URL="https://yourdomain.com" \
  -e BACKEND_URL="localhost:8082" \
  -v ./data:/app/data \
  -v ./logs:/app/logs \
  order-cost-calculator:latest
```

## Network Security Considerations

### Firewall Rules

**Development:**
- Allow inbound: 3000 (frontend), 8082 (backend API)

**Production:**
- Allow inbound: 80 (HTTP), 443 (HTTPS)
- Block direct access to: 8082 (backend should be proxied)

### CORS Configuration

The application automatically configures CORS based on the `ALLOWED_ORIGINS` environment variable:

```bash
# Single domain
ALLOWED_ORIGINS="https://yourdomain.com"

# Multiple domains
ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com,https://admin.yourdomain.com"

# Development + Production
ALLOWED_ORIGINS="https://yourdomain.com,http://localhost:3001"
```

## Authentication Setup

### Initial Admin Setup

1. **Create admin user:**
   ```bash
   curl -X POST https://yourdomain.com/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "password": "your-secure-password",
       "email": "admin@yourdomain.com",
       "admin": true
     }'
   ```

2. **Login to get JWT token:**
   ```bash
   curl -X POST https://yourdomain.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "password": "your-secure-password"
     }'
   ```

3. **Use JWT token in requests:**
   ```bash
   curl -X GET https://yourdomain.com/api/email-enquiries \
     -H "Authorization: Bearer your-jwt-token"
   ```

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check `ALLOWED_ORIGINS` includes your domain
   - Verify frontend is accessing correct API URL
   - Check browser developer tools for exact error

2. **Authentication Errors:**
   - Ensure JWT token is included in Authorization header
   - Check token hasn't expired (24 hours default)
   - Verify user has correct permissions

3. **API Connection Errors:**
   - Verify `REACT_APP_API_URL` is correct
   - Check backend is running on expected port
   - Verify nginx proxy configuration

### Health Checks

```bash
# Frontend health
curl https://yourdomain.com/health

# Backend health
curl https://yourdomain.com/api/health

# Database connectivity
curl -H "Authorization: Bearer jwt-token" https://yourdomain.com/api/email-enquiries
```

### Logs

```bash
# Docker Compose
docker-compose logs -f order-cost-calculator

# Kubernetes
kubectl logs -f deployment/order-cost-calculator -n order-cost-calculator

# Docker Container
docker logs -f order-cost-calculator
```

## Production Checklist

- [ ] Set `OPENAI_API_KEY` environment variable
- [ ] Configure `ALLOWED_ORIGINS` for your domain
- [ ] Set `REACT_APP_API_URL` to your production URL
- [ ] Update Kubernetes ConfigMap with production values
- [ ] Create OpenAI API key secret in Kubernetes
- [ ] Configure SSL/TLS certificates
- [ ] Set up proper firewall rules
- [ ] Create admin user account
- [ ] Test authentication flow
- [ ] Verify CORS configuration
- [ ] Test email webhook integration
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Test disaster recovery procedures

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test network connectivity
4. Validate authentication setup
5. Review CORS configuration

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Enable HTTPS in production
- Regularly rotate API keys
- Monitor API usage and costs
- Implement proper backup and recovery procedures
