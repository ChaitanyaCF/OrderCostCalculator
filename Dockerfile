# Nginx + Spring Boot Dockerfile for Order Cost Calculator
# Frontend served by Nginx on port 3000, Backend on port 8082

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

# Runtime stage - Nginx + Spring Boot
FROM eclipse-temurin:17-jre

# Install nginx and other dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    wget \
    curl \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Set timezone
ENV TZ=UTC

# Create app user with specific UID/GID for volume permissions
RUN groupadd -g 1001 appgroup 2>/dev/null || true && \
    useradd -u 1001 -g 1001 -m appuser 2>/dev/null || true

# Create directories
RUN mkdir -p /app/backend /app/frontend /var/log/nginx /var/lib/nginx /run/nginx /app/logs /app/data

# Copy backend jar
COPY --from=backend-build /app/backend/target/*.jar /app/backend/app.jar

# Copy frontend build to nginx directory
COPY --from=frontend-build /app/frontend/build /app/frontend

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Copy existing database (if available)
COPY docker-data/ /app/data/

# Set permissions
RUN chown -R 1001:1001 /app && \
    chmod -R 755 /app/data && \
    mkdir -p /var/lib/nginx/body /var/lib/nginx/fastcgi /var/lib/nginx/proxy /var/lib/nginx/scgi /var/lib/nginx/uwsgi && \
    chown -R 1001:1001 /var/log/nginx && \
    chown -R 1001:1001 /var/lib/nginx && \
    chown -R 1001:1001 /run/nginx && \
    chmod -R 755 /var/lib/nginx

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

echo "🚀 Starting Order Cost Calculator (Nginx + Spring Boot)..."
echo "=================================================="

# Set default environment variables (configurable URLs preserved)
export REACT_APP_API_URL=${REACT_APP_API_URL:-}
export ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-http://localhost:3000,http://localhost:3001,http://localhost:8082}

# Environment validation
echo "🔧 Environment Configuration:"
echo "   Database: ${SPRING_DATASOURCE_URL:-Default H2}"
echo "   OpenAI API: ${OPENAI_API_KEY:+Configured}"
echo "   Frontend API URL: $REACT_APP_API_URL"
echo "   Allowed Origins: $ALLOWED_ORIGINS"
echo "   JVM Options: $JAVA_OPTS"

# Validate required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY not set. AI processing will be disabled."
else
    echo "✅ OpenAI API key configured (starts with ${OPENAI_API_KEY%${OPENAI_API_KEY#????}}...)"
fi

# Create directories with proper permissions
mkdir -p /app/logs /app/data
chmod 755 /app/data

# Start nginx in background
echo "🌐 Starting Nginx frontend server..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait a moment for nginx to start
sleep 2

# Start Spring Boot backend
echo "🌐 Starting Spring Boot backend..."
echo "   - Frontend: http://localhost:3000/"
echo "   - Backend API: http://localhost:8082/api/"
echo "   - Auth: http://localhost:8082/auth/"
echo "   - Health: http://localhost:8082/api/health"
echo "=================================================="

cd /app/backend
java $JAVA_OPTS \
    -Dspring.profiles.active=docker \
    -Dlogging.level.com.procost.api.controller.ZapierDataController=INFO \
    -jar app.jar &
BACKEND_PID=$!

# Wait for both processes
wait $NGINX_PID $BACKEND_PID
EOF

RUN chmod +x /app/start.sh && chown 1001:1001 /app/start.sh

# Switch to app user
USER appuser

# Expose both ports
EXPOSE 3000 8082

# Health check for both services
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health && \
      wget --no-verbose --tries=1 --spider http://localhost:8082/api/health || exit 1

# Environment variables
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=60.0 -XX:+UseG1GC -XX:+UseStringDeduplication"

# Start the application
CMD ["/app/start.sh"]