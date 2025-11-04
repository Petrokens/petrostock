# Starting the Backend Server

## Windows
1. Double-click `START.bat` OR
2. Run in PowerShell:
   ```powershell
   cd server
   npm install  # First time only
   node index.js
   ```

## The server will:
- Start on `http://localhost:3000`
- Accept WebSocket connections from the frontend
- Fetch live stock data from Groww API
- Send updates to connected clients every 10 seconds

## Verify it's running:
- Open browser: http://localhost:3000/health
- Should see: `{"status":"Server is running!",...}`

## Console logs will show:
- ✅ When clients connect
- 🌐 When fetching from Groww API
- 📤 When sending data to clients
- ❌ Any errors

