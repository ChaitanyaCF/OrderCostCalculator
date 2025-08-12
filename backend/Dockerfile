# Multi-stage build for Spring Boot backend with safe startup logic
FROM maven:3.9.4-eclipse-temurin-17 AS build

# Set working directory to backend (matching script logic)
WORKDIR /app/backend

# Copy pom.xml first for better layer caching
COPY pom.xml .

# Verify this is the correct pom.xml (like the script does)
RUN if ! grep -q "procost-api" pom.xml; then \
        echo "ERROR: Wrong pom.xml detected! This doesn't appear to be the backend pom.xml" && \
        exit 1; \
    fi

# Download dependencies with explicit multimodule directory
RUN mvn dependency:go-offline -B -Dmaven.multiModuleProjectDirectory=/app/backend

# Copy source code
COPY src ./src

# Verify database configuration (adapted from script)
RUN if [ -f "src/main/resources/application.properties" ]; then \
        echo "✅ Found application.properties"; \
        cat src/main/resources/application.properties | grep datasource || true; \
    fi

# Build the application with explicit directory settings (like the script)
RUN mvn clean package -DskipTests -Dmaven.multiModuleProjectDirectory=/app/backend

# Runtime stage
FROM amazoncorretto:17-alpine

# Install necessary packages
RUN apk add --no-cache wget tzdata curl bash

# Set timezone
ENV TZ=UTC

# Create app user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create proper directory structure
WORKDIR /app
RUN mkdir -p /app/data /app/logs /app/backend

# Copy jar from build stage
COPY --from=build /app/backend/target/*.jar /app/backend/app.jar

# Create a startup script that mimics the safe startup logic
RUN echo '#!/bin/bash' > /app/start-backend-docker.sh && \
    echo 'echo "🚀 ProCost Backend Startup (Docker Mode)"' >> /app/start-backend-docker.sh && \
    echo 'echo "=================================================="' >> /app/start-backend-docker.sh && \
    echo 'echo "Working Directory: $(pwd)"' >> /app/start-backend-docker.sh && \
    echo 'echo "JAR Location: /app/backend/app.jar"' >> /app/start-backend-docker.sh && \
    echo 'echo "Database: H2 (file-based in /app/data)"' >> /app/start-backend-docker.sh && \
    echo 'echo "Port: 8082"' >> /app/start-backend-docker.sh && \
    echo 'echo "=================================================="' >> /app/start-backend-docker.sh && \
    echo 'echo "🚀 Starting Spring Boot application..."' >> /app/start-backend-docker.sh && \
    echo 'cd /app/backend' >> /app/start-backend-docker.sh && \
    echo 'exec java -jar \' >> /app/start-backend-docker.sh && \
    echo '  -Dspring.profiles.active=production \' >> /app/start-backend-docker.sh && \
    echo '  -Dspring.datasource.url=jdbc:h2:file:/app/data/procostdb_new \' >> /app/start-backend-docker.sh && \
    echo '  -Dlogging.file.path=/app/logs \' >> /app/start-backend-docker.sh && \
    echo '  -XX:+UseContainerSupport \' >> /app/start-backend-docker.sh && \
    echo '  -XX:MaxRAMPercentage=75.0 \' >> /app/start-backend-docker.sh && \
    echo '  -XX:+UseG1GC \' >> /app/start-backend-docker.sh && \
    echo '  -XX:+UseStringDeduplication \' >> /app/start-backend-docker.sh && \
    echo '  app.jar' >> /app/start-backend-docker.sh && \
    chmod +x /app/start-backend-docker.sh

# Set permissions
RUN chown -R appuser:appgroup /app

# Switch to app user
USER appuser

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8082/ || exit 1

# Use the startup script
CMD ["/app/start-backend-docker.sh"]