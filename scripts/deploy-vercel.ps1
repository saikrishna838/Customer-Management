# Vercel Deployment Script for Customer Management App

param(
    [switch]$Production,
    [switch]$Preview
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

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Status "Vercel CLI version: $vercelVersion"
} catch {
    Write-Warning "Vercel CLI not found. Installing..."
    npm install -g vercel
}

# Check if user is logged in
try {
    $whoami = vercel whoami
    Write-Status "Logged in as: $whoami"
} catch {
    Write-Warning "Not logged in to Vercel. Please log in:"
    vercel login
}

# Install root dependencies for API functions
Write-Status "Installing root dependencies..."
npm install

Write-Info "🔧 Project Structure Created for Vercel:"
Write-Info "  ✅ /api - Serverless functions"
Write-Info "  ✅ /client - React application"
Write-Info "  ✅ vercel.json - Deployment configuration"

Write-Warning "⚠️  Database Configuration Required:"
Write-Warning "  The app is configured with in-memory storage for demo."
Write-Warning "  For production, add a cloud database:"
Write-Warning "  - Vercel Postgres (recommended)"
Write-Warning "  - Supabase (free tier available)"
Write-Warning "  - PlanetScale (MySQL)"

Write-Info "🌐 Environment Variables to Set in Vercel:"
Write-Info "  NODE_ENV=production"
Write-Info "  DATABASE_TYPE=memory (or postgres/mysql)"
Write-Info "  For external DB: Add connection strings"

# Deploy to Vercel
Write-Status "Deploying to Vercel..."
if ($Production) {
    Write-Status "🚀 Deploying to production..."
    vercel --prod
} else {
    Write-Status "🔍 Creating preview deployment..."
    vercel
}

Write-Status "✨ Deployment completed!"
Write-Info "📱 Your app should now be available at the URL provided by Vercel"
Write-Info "🔗 Test the API: https://your-app.vercel.app/api/health"

Write-Warning "📋 Post-Deployment Checklist:"
Write-Warning "  1. Test the health endpoint"
Write-Warning "  2. Test customer CRUD operations"
Write-Warning "  3. Verify SPA routing works"
Write-Warning "  4. Set up persistent database for production"
Write-Warning "  5. Configure custom domain (optional)"
