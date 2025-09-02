# PowerShell Deployment Script for Customer Management App

param(
    [switch]$Production,
    [switch]$Build,
    [switch]$Docker
)

$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan

# Check prerequisites
try {
    $nodeVersion = node --version
    Write-Status "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed or not in PATH"
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Status "npm version: $npmVersion"
} catch {
    Write-Error "npm is not installed or not in PATH"
    exit 1
}

if ($Docker) {
    try {
        $dockerVersion = docker --version
        Write-Status "Docker version: $dockerVersion"
    } catch {
        Write-Error "Docker is not installed or not in PATH"
        exit 1
    }
}

# Backup database if it exists
if (Test-Path "server/database.sqlite") {
    Write-Status "Backing up database..."
    node scripts/backup-database.js
}

if ($Docker) {
    Write-Status "Building and running with Docker..."
    if ($Production) {
        docker-compose up --build -d
    } else {
        docker-compose -f docker-compose.dev.yml up --build -d
    }
    Write-Status "Docker deployment completed!"
    exit 0
}

# Install dependencies
Write-Status "Installing server dependencies..."
Set-Location "server"
npm install
Set-Location ".."

Write-Status "Installing client dependencies..."
Set-Location "client"
npm install
Set-Location ".."

if ($Build -or $Production) {
    Write-Status "Building React application..."
    Set-Location "client"
    npm run build
    Set-Location ".."
}

if ($Production) {
    Write-Status "Starting application in production mode..."
    $env:NODE_ENV = "production"
    Set-Location "server"
    npm start
} else {
    Write-Status "Starting application in development mode..."
    Write-Status "Server: http://localhost:5000"
    Write-Status "Client: http://localhost:3000"
    Write-Warning "Make sure to run both server and client in separate terminals"
    Write-Warning "Server: cd server && npm start"
    Write-Warning "Client: cd client && npm start"
}

Write-Status "Deployment script completed! 🎉"
