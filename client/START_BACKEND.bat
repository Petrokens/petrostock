@echo off
echo ========================================
echo   PetroKens Backend Server Starter
echo ========================================
echo.

echo Checking if backend dependencies are installed...
if not exist "node_modules\express" (
    echo Installing backend dependencies...
    call npm install express node-fetch@3 cors memory-cache socket.io
    echo.
)

echo Starting NSE Live Data Backend Server...
echo Server will run on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js


