# TrustLoops Development Setup Script
# Run this script to set up your local development environment

param(
    [switch]$SkipDotnet,
    [switch]$SkipNode, 
    [switch]$SkipDocker,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up TrustLoops development environment..." -ForegroundColor Green

# Check if running as administrator for some operations
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to check if a command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check and install .NET 8 SDK
if (-not $SkipDotnet) {
    Write-Host "📦 Checking .NET 8 SDK..." -ForegroundColor Yellow
    
    if (Test-Command "dotnet") {
        $dotnetVersion = dotnet --version
        Write-Host "✅ .NET SDK found: $dotnetVersion" -ForegroundColor Green
        
        if ($dotnetVersion -lt "8.0" -and -not $Force) {
            Write-Host "⚠️  .NET 8 is required. Current version: $dotnetVersion" -ForegroundColor Red
            Write-Host "Please update .NET SDK or use -Force to continue" -ForegroundColor Yellow
            exit 1
        }
    }
    else {
        Write-Host "❌ .NET SDK not found. Please install .NET 8 SDK from https://dotnet.microsoft.com/download" -ForegroundColor Red
        exit 1
    }
}

# Check and setup Node.js with pnpm
if (-not $SkipNode) {
    Write-Host "📦 Checking Node.js and pnpm..." -ForegroundColor Yellow
    
    if (Test-Command "node") {
        $nodeVersion = node --version
        Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Node.js not found. Please install Node.js 20+ from https://nodejs.org" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Command "pnpm")) {
        Write-Host "📦 Installing pnpm..." -ForegroundColor Yellow
        npm install -g pnpm
    }
    else {
        Write-Host "✅ pnpm found" -ForegroundColor Green
    }
}

# Check Docker (optional)
if (-not $SkipDocker) {
    Write-Host "🐳 Checking Docker..." -ForegroundColor Yellow
    
    if (Test-Command "docker") {
        Write-Host "✅ Docker found" -ForegroundColor Green
        
        # Check if Docker is running
        try {
            docker version -f json | Out-Null
            Write-Host "✅ Docker is running" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Docker is installed but not running. Please start Docker Desktop." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "⚠️  Docker not found. Install Docker Desktop for local database development." -ForegroundColor Yellow
    }
}

# Install dependencies
Write-Host "📦 Installing project dependencies..." -ForegroundColor Yellow

# Install .NET dependencies
if (-not $SkipDotnet) {
    Write-Host "Installing .NET packages..." -ForegroundColor Cyan
    dotnet restore
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to restore .NET packages" -ForegroundColor Red
        exit 1
    }
}

# Install Node dependencies
if (-not $SkipNode) {
    Write-Host "Installing Node.js packages..." -ForegroundColor Cyan
    pnpm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Node.js packages" -ForegroundColor Red
        exit 1
    }
}

# Setup environment files
Write-Host "⚙️  Setting up environment configuration..." -ForegroundColor Yellow

$envFiles = @(
    @{ Source = ".env.example"; Target = ".env" },
    @{ Source = "apps/web/.env.example"; Target = "apps/web/.env.local" }
)

foreach ($envFile in $envFiles) {
    if (-not (Test-Path $envFile.Target) -or $Force) {
        if (Test-Path $envFile.Source) {
            Copy-Item $envFile.Source $envFile.Target
            Write-Host "✅ Created $($envFile.Target)" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️  $($envFile.Source) not found, skipping..." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "✅ $($envFile.Target) already exists" -ForegroundColor Green
    }
}

# Setup Git hooks (optional)
Write-Host "🔧 Setting up Git hooks..." -ForegroundColor Yellow

if (Test-Path ".git") {
    $gitHooksDir = ".git/hooks"
    
    # Pre-commit hook for linting
    $preCommitHook = @"
#!/bin/sh
echo "Running pre-commit checks..."

# Run .NET formatting check
echo "Checking .NET formatting..."
dotnet format --verify-no-changes --verbosity quiet

if [ `$? -ne 0 ]; then
    echo "❌ .NET formatting issues found. Run 'dotnet format' to fix."
    exit 1
fi

# Run frontend linting
echo "Checking frontend linting..."
pnpm lint

if [ `$? -ne 0 ]; then
    echo "❌ Frontend linting issues found. Run 'pnpm lint --fix' to fix."
    exit 1
fi

echo "✅ Pre-commit checks passed!"
"@

    $preCommitPath = Join-Path $gitHooksDir "pre-commit"
    
    if (-not (Test-Path $preCommitPath) -or $Force) {
        $preCommitHook | Out-File -FilePath $preCommitPath -Encoding UTF8
        
        # Make executable on Unix systems
        if ($IsLinux -or $IsMacOS) {
            chmod +x $preCommitPath
        }
        
        Write-Host "✅ Git pre-commit hook installed" -ForegroundColor Green
    }
    else {
        Write-Host "✅ Git pre-commit hook already exists" -ForegroundColor Green
    }
}

# Database setup
Write-Host "🗄️  Database setup..." -ForegroundColor Yellow

if (Test-Path "docker-compose.yml") {
    Write-Host "Docker Compose found. To start local database, run:" -ForegroundColor Cyan
    Write-Host "  docker-compose up -d postgres" -ForegroundColor White
}

Write-Host "To run database migrations:" -ForegroundColor Cyan
Write-Host "  cd src/TrustLoops.Api && dotnet ef database update" -ForegroundColor White

# Development scripts
Write-Host "📝 Creating development scripts..." -ForegroundColor Yellow

# Backend development script
$backendScript = @"
# Start backend development server
Write-Host "🚀 Starting TrustLoops API..." -ForegroundColor Green
Set-Location src/TrustLoops.Api
dotnet watch run
"@

$backendScript | Out-File -FilePath "dev-backend.ps1" -Encoding UTF8

# Frontend development script
$frontendScript = @"
# Start frontend development server
Write-Host "🚀 Starting TrustLoops Web..." -ForegroundColor Green
pnpm dev --filter web
"@

$frontendScript | Out-File -FilePath "dev-frontend.ps1" -Encoding UTF8

# Full stack development script
$fullStackScript = @"
# Start full development environment
Write-Host "🚀 Starting TrustLoops full stack..." -ForegroundColor Green

# Start database (if using Docker)
if (Test-Path "docker-compose.yml") {
    Write-Host "Starting database..." -ForegroundColor Cyan
    docker-compose up -d postgres
}

# Start backend in background
Write-Host "Starting backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-File", "dev-backend.ps1"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Cyan
pnpm dev --filter web
"@

$fullStackScript | Out-File -FilePath "dev-fullstack.ps1" -Encoding UTF8

Write-Host "✅ Development scripts created:" -ForegroundColor Green
Write-Host "  - dev-backend.ps1 (API server)" -ForegroundColor White
Write-Host "  - dev-frontend.ps1 (Web server)" -ForegroundColor White
Write-Host "  - dev-fullstack.ps1 (Full stack)" -ForegroundColor White

# Build and test
Write-Host "🔨 Running initial build and tests..." -ForegroundColor Yellow

if (-not $SkipDotnet) {
    Write-Host "Building backend..." -ForegroundColor Cyan
    dotnet build --configuration Debug
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Backend build failed. Check your code." -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ Backend build successful" -ForegroundColor Green
    }
}

if (-not $SkipNode) {
    Write-Host "Building frontend..." -ForegroundColor Cyan
    pnpm build --filter web
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Frontend build failed. Check your code." -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ Frontend build successful" -ForegroundColor Green
    }
}

# Success message
Write-Host ""
Write-Host "🎉 TrustLoops development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env files with your configuration" -ForegroundColor White
Write-Host "2. Start database: docker-compose up -d postgres" -ForegroundColor White
Write-Host "3. Run migrations: cd src/TrustLoops.Api && dotnet ef database update" -ForegroundColor White
Write-Host "4. Start development: .\dev-fullstack.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Yellow
Write-Host "  .\dev-backend.ps1     - Start API server only" -ForegroundColor White
Write-Host "  .\dev-frontend.ps1    - Start web server only" -ForegroundColor White
Write-Host "  .\dev-fullstack.ps1   - Start full development stack" -ForegroundColor White
Write-Host "  pnpm test            - Run all tests" -ForegroundColor White
Write-Host "  pnpm lint            - Run linting" -ForegroundColor White
Write-Host "  dotnet format        - Format C# code" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
