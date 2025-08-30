param(
  [int]$ApiPort = 5000,
  [int]$WebPort = 5173,
  [switch]$NoSupabase,
  [switch]$NoBackend,
  [switch]$NoFrontend
)

$ErrorActionPreference = "Stop"

function Test-Command($cmd) {
  try { Get-Command $cmd -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

Write-Host "Starting TrustLoops local dev..." -ForegroundColor Green

# Supabase (optional)
if (-not $NoSupabase) {
  if (Test-Command "supabase") {
    try {
      $supabaseDir = Join-Path $PSScriptRoot "..\supabase"
      Write-Host "Starting Supabase (if not already running)..." -ForegroundColor Cyan
      Start-Process supabase -WorkingDirectory $supabaseDir -ArgumentList @("start") | Out-Null
    } catch {
      Write-Warning "Could not start Supabase; ensure Docker is running or pass -NoSupabase. $_"
    }
  } else {
    Write-Host "Supabase CLI not found. Skipping local DB. Install from https://supabase.com/docs/guides/cli or pass -NoSupabase" -ForegroundColor Yellow
  }
}

# Backend
if (-not $NoBackend) {
  $backendWorkDir = Join-Path $PSScriptRoot "..\src\WebApp"
  Write-Host "Starting API on http://localhost:$ApiPort ..." -ForegroundColor Cyan
  Start-Process dotnet -WorkingDirectory $backendWorkDir -ArgumentList @("watch","run","--urls","http://localhost:$ApiPort") | Out-Null
}

Start-Sleep -Seconds 2

# Frontend
if (-not $NoFrontend) {
  $frontendWorkDir = Join-Path $PSScriptRoot "..\apps\web"
  Write-Host "Starting Web on http://localhost:$WebPort ..." -ForegroundColor Cyan
  Start-Process pnpm -WorkingDirectory $frontendWorkDir -ArgumentList @("dev","--port","$WebPort") | Out-Null
}

Write-Host "Local dev started. API: http://localhost:$ApiPort | Web: http://localhost:$WebPort" -ForegroundColor Green
