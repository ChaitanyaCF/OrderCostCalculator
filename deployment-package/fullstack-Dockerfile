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
FROM eclipse-temurin:17-jre-alpine

# Install nginx and other dependencies
RUN apk add --no-cache nginx tzdata wget

# Set timezone
ENV TZ=UTC

# Create app user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create directories
RUN mkdir -p /app/backend /app/frontend /var/log/nginx /var/lib/nginx /run/nginx

# Copy backend jar
COPY --from=backend-build /app/backend/target/*.jar /app/backend/app.jar

# Copy frontend build
COPY --from=frontend-build /app/frontend/build /app/frontend

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Set permissions
RUN chown -R appuser:appgroup /app && \
    chown -R nginx:nginx /app/frontend && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/lib/nginx && \
    chown -R nginx:nginx /run/nginx

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

echo "Starting Order Cost Calculator..."

# Start nginx in background
echo "Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Start Spring Boot application
echo "Starting backend..."
cd /app/backend
exec java $JAVA_OPTS -jar app.jar
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
