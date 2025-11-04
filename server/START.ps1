# PetroKens Live Stock Server Startup Script
Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PetroKens Live Stock Server v1.0    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Change to server directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Write-Host ""
    npm install
    Write-Host ""
}

Write-Host "🚀 Starting server..." -ForegroundColor Green
Write-Host "📊 Server will run on http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start the server
node index.js

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Red
pause

