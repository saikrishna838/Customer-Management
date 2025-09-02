# Customer Management System - Production Deployment Guide

This document provides comprehensive instructions for deploying the Customer Management System in a production environment.

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd customer-management-app

# Build and run with Docker Compose
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Option 2: Manual Deployment

```bash
# Install dependencies and build
npm run install:all
npm run build

# Start in production mode
npm run start:prod
```

### Option 3: Using Deployment Script

```bash
# Make the script executable (Linux/Mac)
chmod +x scripts/deploy.sh

# Run deployment script
./scripts/deploy.sh
```

## 📋 Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Version 8 or higher
- **Docker** (optional, but recommended)
- **PM2** (optional, for process management)

## 🔧 Environment Configuration

### Server Environment Variables

Create a `.env.production` file in the root directory:

```env
NODE_ENV=production
PORT=5000
DB_PATH=/app/data/database.sqlite
JWT_SECRET=your-super-secure-jwt-secret-key-here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Client Environment Variables

Create a `client/.env.production` file:

```env
REACT_APP_API_URL=/api
```

## 🐳 Docker Deployment

### Production Docker Compose

```bash
# Build and run the production container
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Development Docker Compose

```bash
# Run development environment with hot reload
docker-compose -f docker-compose.dev.yml up --build
```

### Single Docker Container

```bash
# Build the image
docker build -t customer-management-app .

# Run the container
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  customer-management-app
```

## 🔒 Security Considerations

### Production Security Features

- **Helmet.js**: Security headers protection
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable allowed origins
- **Input Validation**: Server-side validation for all endpoints
- **Non-root User**: Docker container runs as non-root user
- **HTTPS**: Configure reverse proxy for SSL termination

### Recommended Security Setup

1. **Use HTTPS**: Always use SSL/TLS in production
2. **Environment Variables**: Never commit sensitive data to git
3. **Database Security**: Regular backups and restricted access
4. **Firewall**: Only expose necessary ports (80, 443, 22)
5. **Updates**: Keep dependencies updated

## 📊 Process Management with PM2

### Install PM2

```bash
npm install -g pm2
```

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'customer-management-app',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
```

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Restart
pm2 restart customer-management-app

# Stop
pm2 stop customer-management-app

# View logs
pm2 logs customer-management-app

# Save PM2 configuration
pm2 save
pm2 startup
```

## 💾 Database Management

### Backup Strategy

```bash
# Manual backup
npm run backup:db

# Automated backups (add to crontab)
0 2 * * * cd /path/to/app && npm run backup:db
```

### Database Location

- **Development**: `server/database.sqlite`
- **Production**: `/app/data/database.sqlite` (in Docker)

## 🌐 Reverse Proxy Configuration

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔍 Monitoring and Logging

### Health Check

The application provides a health check endpoint:

```
GET /api/health
```

### Logging

- **Development**: Detailed logs with Morgan 'dev' format
- **Production**: Combined format with request details

### Monitoring Commands

```bash
# Check application status
curl http://localhost:5000/api/health

# Monitor with PM2
pm2 monit

# View Docker container logs
docker-compose logs -f app
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   lsof -i :5000
   kill -9 <PID>
   ```

2. **Database Permissions**
   ```bash
   chown -R nodejs:nodejs /app/data
   chmod 664 /app/data/database.sqlite
   ```

3. **Build Failures**
   ```bash
   rm -rf client/node_modules client/build
   rm -rf server/node_modules
   npm run install:all
   npm run build
   ```

### Log Locations

- **PM2 Logs**: `~/.pm2/logs/`
- **Docker Logs**: `docker-compose logs app`
- **Application Logs**: Console output

## 📈 Performance Optimization

### Production Optimizations

- **Compression**: Gzip compression enabled
- **Static Files**: Efficient serving of React build
- **Database**: SQLite with WAL mode for better concurrency
- **Caching**: Browser caching for static assets

### Scaling Considerations

For high-traffic scenarios, consider:

- **Load Balancer**: Multiple application instances
- **Database**: PostgreSQL or MySQL for better concurrency
- **CDN**: Static asset delivery
- **Caching**: Redis for session/data caching

## 🔄 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backed up
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Health checks working
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] Backup strategy in place

## 📞 Support

For deployment issues or questions, check:

1. Application logs
2. Health check endpoint
3. Database connectivity
4. Environment variables
5. Port availability

---

**Security Note**: Always review and customize the security configurations based on your specific requirements and infrastructure setup.
