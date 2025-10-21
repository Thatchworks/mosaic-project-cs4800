#!/bin/bash

# Enhanced deployment script for GitHub Actions
# This script is designed to work with CI/CD pipelines

set -e  # Exit on any error

EC2_IP=${1:-"localhost"}
echo "Deploying to EC2 IP: $EC2_IP"

# Create environment file with secure defaults
cat > .env << EOF
# Production Environment Variables for IP-based deployment
ENVIRONMENT=production
DOMAIN=$EC2_IP
PROJECT_NAME=Mosaic Project
STACK_NAME=mosaic-project-production
BACKEND_CORS_ORIGINS=http://$EC2_IP:5173,http://$EC2_IP:80,http://$EC2_IP,http://localhost:5173,http://localhost:80
FRONTEND_HOST=http://$EC2_IP:5173
SECRET_KEY=${SECRET_KEY:-$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")}
FIRST_SUPERUSER=${FIRST_SUPERUSER:-admin@example.com}
FIRST_SUPERUSER_PASSWORD=${FIRST_SUPERUSER_PASSWORD:-$(python3 -c "import secrets; print(secrets.token_urlsafe(16))")}
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(python3 -c "import secrets; print(secrets.token_urlsafe(16))")}
POSTGRES_DB=app
SMTP_HOST=${SMTP_HOST:-}
SMTP_USER=${SMTP_USER:-}
SMTP_PASSWORD=${SMTP_PASSWORD:-}
EMAILS_FROM_EMAIL=${EMAILS_FROM_EMAIL:-}
DOCKER_IMAGE_BACKEND=mosaic-backend
DOCKER_IMAGE_FRONTEND=mosaic-frontend
TAG=latest
EOF

echo "Environment file created"

# Create production docker-compose file
cat > docker-compose.production.yml << EOF
services:
  db:
    image: postgres:17
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER} -d \${POSTGRES_DB}"]
      interval: 10s
      retries: 5
      start_period: 30s
      timeout: 10s
    volumes:
      - app-db-data:/var/lib/postgresql/data/pgdata
    environment:
      - PGDATA=/var/lib/postgresql/data/pgdata
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_DB=\${POSTGRES_DB}
    ports:
      - "5432:5432"

  adminer:
    image: adminer
    restart: always
    depends_on:
      - db
    environment:
      - ADMINER_DESIGN=pepa-linha-dark
    ports:
      - "8080:8080"

  prestart:
    image: \${DOCKER_IMAGE_BACKEND}:\${TAG}
    build:
      context: ./backend
    depends_on:
      db:
        condition: service_healthy
        restart: true
    command: bash scripts/prestart.sh
    environment:
      - DOMAIN=\${DOMAIN}
      - FRONTEND_HOST=\${FRONTEND_HOST}
      - ENVIRONMENT=\${ENVIRONMENT}
      - BACKEND_CORS_ORIGINS=\${BACKEND_CORS_ORIGINS}
      - SECRET_KEY=\${SECRET_KEY}
      - FIRST_SUPERUSER=\${FIRST_SUPERUSER}
      - FIRST_SUPERUSER_PASSWORD=\${FIRST_SUPERUSER_PASSWORD}
      - SMTP_HOST=\${SMTP_HOST}
      - SMTP_USER=\${SMTP_USER}
      - SMTP_PASSWORD=\${SMTP_PASSWORD}
      - EMAILS_FROM_EMAIL=\${EMAILS_FROM_EMAIL}
      - POSTGRES_SERVER=db
      - POSTGRES_PORT=\${POSTGRES_PORT}
      - POSTGRES_DB=\${POSTGRES_DB}
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}

  backend:
    image: \${DOCKER_IMAGE_BACKEND}:\${TAG}
    restart: always
    depends_on:
      db:
        condition: service_healthy
        restart: true
      prestart:
        condition: service_completed_successfully
    build:
      context: ./backend
    environment:
      - DOMAIN=\${DOMAIN}
      - FRONTEND_HOST=\${FRONTEND_HOST}
      - ENVIRONMENT=\${ENVIRONMENT}
      - BACKEND_CORS_ORIGINS=\${BACKEND_CORS_ORIGINS}
      - SECRET_KEY=\${SECRET_KEY}
      - FIRST_SUPERUSER=\${FIRST_SUPERUSER}
      - FIRST_SUPERUSER_PASSWORD=\${FIRST_SUPERUSER_PASSWORD}
      - SMTP_HOST=\${SMTP_HOST}
      - SMTP_USER=\${SMTP_USER}
      - SMTP_PASSWORD=\${SMTP_PASSWORD}
      - EMAILS_FROM_EMAIL=\${EMAILS_FROM_EMAIL}
      - POSTGRES_SERVER=db
      - POSTGRES_PORT=\${POSTGRES_PORT}
      - POSTGRES_DB=\${POSTGRES_DB}
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/utils/health-check/"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "8000:8000"

  frontend:
    image: \${DOCKER_IMAGE_FRONTEND}:\${TAG}
    restart: always
    build:
      context: ./frontend
      args:
        - VITE_API_URL=http://$EC2_IP:8000
        - NODE_ENV=production
    ports:
      - "80:80"

volumes:
  app-db-data:
EOF

echo "Production docker-compose file created"

# Function to check if a service is healthy
check_service_health() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    echo "Checking health of $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose -f docker-compose.production.yml ps $service_name | grep -q "healthy\|Up"; then
            echo "$service_name is healthy!"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "Warning: $service_name may not be fully healthy after $max_attempts attempts"
    return 1
}

# Function to test API endpoints
test_endpoints() {
    local ec2_ip=$1
    
    echo "Testing API endpoints..."
    
    # Test backend health
    if curl -f -s http://localhost:8000/api/v1/utils/health-check/ > /dev/null; then
        echo "✅ Backend health check passed"
    else
        echo "❌ Backend health check failed"
        return 1
    fi
    
    # Test frontend
    if curl -f -s http://localhost:80 > /dev/null; then
        echo "✅ Frontend is accessible"
    else
        echo "❌ Frontend is not accessible"
        return 1
    fi
    
    echo "✅ All endpoints are working correctly"
    return 0
}

echo "Deployment configuration completed successfully!"
echo ""
echo "Services will be available at:"
echo "- Frontend: http://$EC2_IP"
echo "- Backend API: http://$EC2_IP:8000"
echo "- API Docs: http://$EC2_IP:8000/docs"
echo "- Adminer: http://$EC2_IP:8080"
echo ""
echo "To start the services, run:"
echo "docker compose -f docker-compose.production.yml up -d"
