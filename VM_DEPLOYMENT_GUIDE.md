# VM Deployment Guide

## CORS Configuration Fix

The application is now configured to work with any origin, but you need to set the proper environment variables on your VM.

## Environment Variables Required

### Backend (Java Application)
Set these environment variables before starting the backend:

```bash
export ALLOWED_ORIGINS="http://13.203.41.13:3000,https://13.203.41.13:3000"
export DATABASE_URL="jdbc:postgresql://localhost:5432/procostdb"
export DATABASE_USERNAME="procost_user"
export DATABASE_PASSWORD="your_db_password"
export JWT_SECRET="your_jwt_secret_key"
export OPENAI_API_KEY="your_openai_api_key"
```

### Frontend (React Application)
Set these environment variables before building/starting the frontend:

```bash
export REACT_APP_API_URL="http://13.203.41.13:8082"
```

## Deployment Steps

### 1. Update Backend Configuration
```bash
# Set environment variables
export ALLOWED_ORIGINS="http://13.203.41.13:3000,https://13.203.41.13:3000"
export REACT_APP_API_URL="http://13.203.41.13:8082"

# Restart your backend service
# (depends on how you're running it - systemd, docker, etc.)
```

### 2. Update Frontend Configuration
```bash
# If using Docker, rebuild the frontend image with the correct API URL
docker build -t procost-frontend --build-arg REACT_APP_API_URL=http://13.203.41.13:8082 ./frontend

# If running directly, set the environment variable and restart
export REACT_APP_API_URL="http://13.203.41.13:8082"
npm start
```

### 3. Docker Deployment (Recommended)
If using Docker Compose, update your docker-compose.yml:

```yaml
version: '3.8'
services:
  backend:
    # ... other config
    environment:
      - ALLOWED_ORIGINS=http://13.203.41.13:3000,https://13.203.41.13:3000
      - DATABASE_URL=jdbc:postgresql://db:5432/procostdb
      # ... other env vars
  
  frontend:
    # ... other config
    environment:
      - REACT_APP_API_URL=http://13.203.41.13:8082
```

## Testing the Fix

1. **Clear browser cache** completely
2. **Restart both frontend and backend** with the new environment variables
3. **Check browser console** - CORS errors should be gone
4. **Test login** with credentials: `Chaitanya` / `Test123`

## Troubleshooting

If you still see CORS errors:
1. Verify environment variables are set: `echo $ALLOWED_ORIGINS`
2. Check backend logs for CORS filter messages
3. Ensure both services are restarted after setting env vars
4. Try accessing backend directly: `curl http://13.203.41.13:8082/api/health`

## Security Note

For production, replace `*` with specific allowed origins:
- Update `ALLOWED_ORIGINS` to only include your actual domain
- Use HTTPS instead of HTTP
- Set proper JWT secrets and database passwords
