#!/bin/bash

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Backup database if it exists
if [ -f "server/database.sqlite" ]; then
    print_status "Backing up database..."
    node scripts/backup-database.js
fi

# Install dependencies
print_status "Installing server dependencies..."
cd server
npm ci --only=production --silent

cd ..

print_status "Installing client dependencies..."
cd client
npm ci --only=production --silent

# Build client
print_status "Building React application for production..."
npm run build

cd ..

# Set production environment
export NODE_ENV=production

# Start the application
print_status "Starting application in production mode..."
print_warning "Make sure to set up your production environment variables in .env.production"
print_status "Application will start on port ${PORT:-5000}"

# Option to use PM2 for process management
if command -v pm2 &> /dev/null; then
    print_status "PM2 detected. Starting application with PM2..."
    pm2 start server/index.js --name "customer-management-app" --env production
    pm2 save
    print_status "Application started with PM2. Use 'pm2 status' to check status."
else
    print_warning "PM2 not found. Starting application directly..."
    print_warning "For production, consider installing PM2: npm install -g pm2"
    cd server
    npm start
fi

print_status "Deployment completed successfully! 🎉"
