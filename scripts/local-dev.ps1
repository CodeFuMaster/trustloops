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

Write-Host "🚀 TrustLoops local dev starting..." -ForegroundColor Green

# Supabase (optional)
if (-not $NoSupabase) {
  if (Test-Command "supabase") {
    try {
      Push-Location "$PSScriptRoot\..\supabase"
      Write-Host "🟢 Starting Supabase (if not already running)..." -ForegroundColor Cyan
      supabase start | Write-Host
    } catch {
      Write-Warning "Could not start Supabase; ensure Docker is running or pass -NoSupabase. $_"
    } finally {
      Pop-Location
    }
  } else {
    Write-Host "ℹ️ Supabase CLI not found. Skipping local DB. Install from https://supabase.com/docs/guides/cli or pass -NoSupabase" -ForegroundColor Yellow
  }
}

# Backend
if (-not $NoBackend) {
  $backendCmd = "${env:ComSpec} /c set ASPNETCORE_URLS=http://localhost:$ApiPort && dotnet watch run"
  $backendWorkDir = Join-Path $PSScriptRoot "..\src\WebApp"
  Write-Host "🟢 Starting API on http://localhost:$ApiPort ..." -ForegroundColor Cyan
  Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location `$'$backendWorkDir`$'; $backendCmd" | Out-Null
}

Start-Sleep -Seconds 2

# Frontend
if (-not $NoFrontend) {
  $frontendWorkDir = Join-Path $PSScriptRoot "..\apps\web"
  $frontendCmd = "pnpm dev --port $WebPort"
  Write-Host "🟢 Starting Web on http://localhost:$WebPort ..." -ForegroundColor Cyan
  Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location `$'$frontendWorkDir`$'; $frontendCmd" | Out-Null
}

Write-Host "✅ Local dev started. API: http://localhost:$ApiPort | Web: http://localhost:$WebPort" -ForegroundColor Green
