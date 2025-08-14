# Full-stack Dockerfile for Order Cost Calculator
# This builds both frontend and backend in a single container

FROM node:18-alpine AS frontend-build

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.4-eclipse-temurin-17 AS backend-build

# Build backend
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre

# Install nginx and other dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set timezone
ENV TZ=UTC

# Create app user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Create directories (FIXED: Added /app/data)
RUN mkdir -p /app/backend /app/frontend /var/log/nginx /var/lib/nginx /run/nginx /app/logs /app/data

# Copy backend jar
COPY --from=backend-build /app/backend/target/*.jar /app/backend/app.jar

# Copy frontend build
COPY --from=frontend-build /app/frontend/build /app/frontend

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Set permissions
RUN chown -R appuser:appgroup /app && \
    chown -R www-data:www-data /app/frontend && \
    chown -R www-data:www-data /var/log/nginx && \
    chown -R www-data:www-data /var/lib/nginx && \
    chown -R www-data:www-data /run/nginx

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

echo "🚀 Starting Order Cost Calculator with Enhanced Features..."
echo "=================================================="

# Environment validation
echo "🔧 Environment Configuration:"
echo "   Database: ${SPRING_DATASOURCE_URL:-Default H2}"
echo "   OpenAI API: ${OPENAI_API_KEY:+Configured}"
echo "   JVM Options: $JAVA_OPTS"

# Validate required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY not set. AI processing will be disabled."
else
    echo "✅ OpenAI API key configured (starts with ${OPENAI_API_KEY%${OPENAI_API_KEY#????}}...)"
fi

# Create directories with proper permissions (FIXED: Added data directory)
mkdir -p /app/logs /app/data
chmod 755 /app/data

# Start nginx in background
echo "🌐 Starting nginx frontend server..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait a moment for nginx to start
sleep 2

# Start Spring Boot application with conversation progression
echo "📧 Starting backend with conversation progression logic..."
echo "   - Enhanced email processing"
echo "   - Conversation threading"
echo "   - AI-powered classification"
echo "   - Status progression tracking"
echo "=================================================="

cd /app/backend
exec java $JAVA_OPTS \
    -Dspring.profiles.active=docker \
    -Dlogging.level.com.procost.api.controller.ZapierDataController=INFO \
    -jar app.jar
EOF

RUN chmod +x /app/start.sh && chown appuser:appgroup /app/start.sh

# Switch to app user
USER appuser

# Expose ports
EXPOSE 3000 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health && \
      wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1

# Environment variables
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=60.0 -XX:+UseG1GC -XX:+UseStringDeduplication"

# Start both services
CMD ["/app/start.sh"]
