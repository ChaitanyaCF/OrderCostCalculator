# Order Cost Calculator - Deployment Guide

## 🚀 Enhanced Features

This deployment includes the latest conversation progression features:

- **📧 Email Threading**: Automatic conversation tracking using `conversationId`
- **🔄 Status Progression**: Enquiry → Quote → Order progression tracking
- **🤖 AI Classification**: Enhanced email classification with OpenAI integration
- **📊 Real-time Dashboard**: Live updates and conversation timeline
- **🔍 Enhanced Logging**: Detailed debug information for troubleshooting

## 🐳 Docker Deployment (Recommended)

### Prerequisites

- Docker 20.x or higher
- Docker Compose 2.x or higher
- OpenAI API Key (for AI features)

### Quick Start

1. **Clone and prepare**:
   ```bash
   git clone <your-repo-url>
   cd OrderCostCalculator
   ```

2. **Set OpenAI API Key**:
   ```bash
   export OPENAI_API_KEY="your-openai-api-key-here"
   ```

3. **Deploy**:
   ```bash
   ./deploy-local-docker.sh
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8082

### Manual Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Ingress controller (nginx recommended)
- OpenAI API Key

### Deploy to Kubernetes

1. **Deploy using script**:
   ```bash
   ./deploy-kubernetes.sh
   ```

2. **Manual deployment**:
   ```bash
   # Create namespace
   kubectl apply -f k8s/namespace.yaml
   
   # Create secret with your OpenAI API key
   kubectl create secret generic order-cost-calculator-secrets \
     --namespace=order-cost-calculator \
     --from-literal=openai-api-key="your-openai-api-key"
   
   # Apply all configurations
   kubectl apply -f k8s/
   ```

3. **Access the application**:
   ```bash
   # Port forward (development)
   kubectl port-forward -n order-cost-calculator svc/order-cost-calculator-service 3000:3000 &
   kubectl port-forward -n order-cost-calculator svc/order-cost-calculator-service 8082:8082 &
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | - | Yes* |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` | No |
| `SPRING_DATASOURCE_URL` | Database URL | H2 file | No |
| `JAVA_OPTS` | JVM options | Optimized | No |

*Required for conversation progression and AI classification

### Database Configuration

The application uses H2 database by default:
- **Development**: File-based H2 (`./docker-data/procostdb_new.mv.db`)
- **Production**: Can be configured for PostgreSQL/MySQL

### Conversation Progression Setup

1. **Zapier Integration**:
   - Use ngrok to expose your backend: `ngrok http 8082`
   - Set webhook URL: `https://your-ngrok-url.ngrok.app/api/zapier/receive-email`
   - Ensure Zapier sends `conversationId`, `threadId`, and `messageId`

2. **Required Zapier Fields**:
   ```json
   {
     "fromEmail": "customer@example.com",
     "subject": "Email subject",
     "emailBody": "Email content",
     "conversationId": "unique-conversation-id",
     "messageId": "unique-message-id",
     "threadId": "email-thread-id",
     "receivedAt": "2025-01-21T10:00:00Z"
   }
   ```

## 📊 Monitoring and Troubleshooting

### Health Checks

- **Frontend**: `GET /health`
- **Backend**: `GET /api/health`

### Logs

**Docker**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f order-cost-calculator
```

**Kubernetes**:
```bash
# Application logs
kubectl logs -f deployment/order-cost-calculator -n order-cost-calculator

# Get all resources
kubectl get all -n order-cost-calculator
```

### Debug Conversation Progression

1. **Enable debug logging** (add to environment):
   ```
   LOGGING_LEVEL_COM_PROCOST_API_CONTROLLER_ZAPIERDATACONTROLLER=DEBUG
   ```

2. **Watch conversation logs**:
   ```bash
   # Docker
   docker-compose logs -f | grep "🔥"
   
   # Kubernetes
   kubectl logs -f deployment/order-cost-calculator -n order-cost-calculator | grep "🔥"
   ```

3. **Test conversation flow**:
   ```bash
   # Send test enquiry
   curl -X POST http://localhost:8082/api/zapier/receive-email \
     -H "Content-Type: application/json" \
     -d '{
       "fromEmail": "test@example.com",
       "subject": "Test Enquiry",
       "emailBody": "I need 500kg salmon",
       "conversationId": "test-conv-123"
     }'
   
   # Send follow-up order
   curl -X POST http://localhost:8082/api/zapier/receive-email \
     -H "Content-Type: application/json" \
     -d '{
       "fromEmail": "test@example.com", 
       "subject": "Re: Test Enquiry",
       "emailBody": "Please proceed with the order",
       "conversationId": "test-conv-123"
     }'
   ```

## 🔒 Production Considerations

### Security

1. **Environment Variables**: Use Kubernetes secrets or Docker secrets
2. **HTTPS**: Configure TLS certificates
3. **Database**: Use external database for production
4. **API Keys**: Rotate OpenAI API keys regularly

### Scaling

1. **Horizontal Scaling**: Increase replicas in Kubernetes
2. **Resource Limits**: Configure CPU/memory limits
3. **Auto-scaling**: Use HPA (Horizontal Pod Autoscaler)

### Backup

1. **Database**: Regular backups of H2 files or external DB
2. **Configuration**: Version control all config files
3. **Logs**: Centralized logging (ELK, Grafana)

## 🆘 Support

### Common Issues

1. **OpenAI API Errors**: Check API key and quotas
2. **Conversation Not Linking**: Verify `conversationId` consistency
3. **Database Issues**: Check file permissions and disk space
4. **Port Conflicts**: Ensure ports 3000 and 8082 are available

### Getting Help

1. Check application logs first
2. Verify environment variables
3. Test with curl commands
4. Review conversation progression logs with `grep "🔥"`

## 📈 Version History

- **v1.0.0**: Initial release with basic functionality
- **v1.1.0**: Added conversation progression features
- **v1.2.0**: Enhanced logging and AI classification
- **v1.3.0**: Docker and Kubernetes deployment ready
