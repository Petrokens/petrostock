@echo off
cls
echo ╔════════════════════════════════════════╗
echo ║   PetroKens Live Stock Server v1.0    ║
echo ╚════════════════════════════════════════╝
echo.

cd /d %~dp0

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    echo.
    call npm install
    echo.
)

echo 🚀 Starting server...
echo 📊 Server will run on http://localhost:3000
echo 🔌 Press Ctrl+C to stop the server
echo ════════════════════════════════════════
echo.

node index.js

pause

