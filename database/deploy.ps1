# TrustLoops Production Database Migration Script (PowerShell)
# Run this to set up the complete production database schema

Write-Host "🚀 TrustLoops Production Database Migration" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    Write-Host "   or visit: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a Supabase project
if (-not (Test-Path "supabase/config.toml")) {
    Write-Host "⚠️  Supabase config not found. Initializing..." -ForegroundColor Yellow
    supabase init
}

Write-Host "📝 Running production database migration..." -ForegroundColor Blue

# Apply the migration using the SQL file directly
$migrationFile = "database/migrations/production_schema.sql"
if (Test-Path $migrationFile) {
    Write-Host "Applying migration from $migrationFile..." -ForegroundColor Blue
    # For now, we'll provide instructions since direct SQL execution needs proper setup
    Write-Host "Please run the following SQL in your Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host "File: $migrationFile" -ForegroundColor Yellow
} else {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Migration script prepared!" -ForegroundColor Green
Write-Host ""
Write-Host "Manual steps to complete:" -ForegroundColor Yellow
Write-Host "1. Go to your Supabase dashboard: https://anbgwbudvnjxsrgzpkot.supabase.co" -ForegroundColor White
Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
Write-Host "3. Copy and run the SQL from: database/migrations/production_schema.sql" -ForegroundColor White
Write-Host "4. Restart your backend server" -ForegroundColor White
Write-Host "5. Test project creation" -ForegroundColor White
