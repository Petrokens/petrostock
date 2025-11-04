# PetroKens Live Stock Backend Server

This server fetches live stock data from **Finnhub API**, caches it, and broadcasts updates to connected clients via WebSockets (Socket.IO).

## 🌟 Features

- **Finnhub API Integration** - Reliable, professional financial data API
- **WebSocket Broadcasting** - Real-time progressive updates via Socket.IO
- **Smart Caching** - 30-second cache to reduce API calls
- **Progressive Loading** - Stocks update one-by-one as data arrives
- **No Rate Limiting Issues** - Finnhub free tier allows 60 calls/minute
- **Automatic Retries** - Failed symbols are automatically retried
- **Health Check Endpoint** - `/` returns server status
- **Proxy Endpoint** - `/api/quote?symbol=SYMBOL` for direct quotes

## 📡 Data Provider

**[Finnhub.io](https://finnhub.io/docs/api)** - Professional-grade financial data API

### Why Finnhub?
- ✅ **Reliable** - No 401/403 authentication errors
- ✅ **Fast** - Sub-second response times
- ✅ **Generous Free Tier** - 60 API calls/minute
- ✅ **Real-time Data** - Live quotes with minimal delay
- ✅ **Global Coverage** - Supports NSE, BSE, NYSE, NASDAQ, etc.

## 🔑 API Key

Current API Key: `d41l1t1r01qo6qdh5krgd41l1t1r01qo6qdh5ks0`

**Note:** This is a free tier key. For production use, consider upgrading to a paid plan for higher limits.

## 📊 Supported Stocks

All **NIFTY 50** stocks with `.NS` suffix for NSE:
- RELIANCE.NS, TCS.NS, HDFCBANK.NS, ICICIBANK.NS, INFY.NS, etc.

## 🚀 Setup

### 1. Navigate to server directory
```bash
cd D:\react_stock\server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the server
```bash
npm start
```

Or use the batch file:
```bash
START.bat
```

## 🔄 How It Works

### Sequential Fetching with Progressive Updates

1. **Initial Connection** - Sends cached data immediately to new clients
2. **Progressive Fetching** - Fetches stocks one-by-one from Finnhub
3. **Immediate Broadcasting** - Each stock update is sent via WebSocket as soon as fetched
4. **Client Updates** - Frontend receives and displays updates progressively

### Data Flow

```
Finnhub API → Server Cache → WebSocket → Frontend
     ↓              ↓            ↓           ↓
  Quote API    30s cache    Socket.IO   Real-time UI
```

## 📖 API Endpoints

### Health Check
```bash
GET http://localhost:3000/
```

Response:
```json
{
  "status": "running",
  "message": "PetroKens Live Stock Server v3.0 (Finnhub API)",
  "provider": "Finnhub",
  "monitoring": 50,
  "uptime": 12345,
  "connections": 1,
  "cachedSymbols": 50,
  "requestCount": 150
}
```

### Get Quote
```bash
GET http://localhost:3000/api/quote?symbol=RELIANCE
```

Response:
```json
{
  "symbol": "RELIANCE.NS",
  "current": 2450.80,
  "change": 12.50,
  "changePercent": 0.51,
  "high": 2465.00,
  "low": 2435.20,
  "open": 2440.00,
  "previousClose": 2438.30,
  "timestamp": 1640000000
}
```

## 🔌 WebSocket Events

### Connection
```javascript
socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Price Updates (Progressive)
```javascript
socket.on('priceUpdate', (updates) => {
  // updates is an array of 1 or more stock updates
  updates.forEach(update => {
    console.log(`${update.symbol}: ₹${update.last}`);
  });
});
```

Update format:
```javascript
{
  symbol: "RELIANCE",        // Clean symbol (without .NS)
  name: "Reliance Industries", // Company name
  last: 2450.80,             // Current price
  chg: 12.50,                // Change
  pchg: 0.51,                // Change percent
  vol: 5234567,              // Volume (estimated)
  high: 2465.00,             // Day high
  low: 2435.20,              // Day low
  open: 2440.00,             // Open price
  previousClose: 2438.30     // Previous close
}
```

## ⚙️ Configuration

### Adjust Update Frequency

In `index.js`:
```javascript
// Current: 30 seconds
setInterval(broadcastPrices, 30000);

// Faster: 15 seconds
setInterval(broadcastPrices, 15000);

// Slower: 60 seconds
setInterval(broadcastPrices, 60000);
```

### Adjust Cache Duration

```javascript
// Current: 30 seconds
const CACHE_MS = 30_000;

// Faster updates: 15 seconds
const CACHE_MS = 15_000;

// Slower updates: 60 seconds
const CACHE_MS = 60_000;
```

### Adjust Delay Between Requests

```javascript
// Current: 500-1000ms
await randomDelay(500, 1000);

// Faster (but uses more API quota)
await randomDelay(200, 500);

// Slower (more conservative)
await randomDelay(1000, 2000);
```

## 📊 Performance

### Timing
- **First broadcast**: ~30-60 seconds (50 stocks × 0.5-1s each)
- **Subsequent broadcasts**: Uses cached data, instant for clients
- **New client connection**: Instant (sends cached data immediately)

### API Usage (Free Tier Limits)
- **Finnhub Free**: 60 calls/minute
- **Our usage**: ~50 calls every 30 seconds = 100 calls/minute during broadcast
- **Recommendation**: Increase delay or reduce frequency if hitting limits

### Upgrade Options
If you hit rate limits, consider:
1. Increase broadcast interval to 60 seconds
2. Increase delay between requests to 1-2 seconds
3. Upgrade to Finnhub paid plan for higher limits

## 🎯 Console Output

```
╔════════════════════════════════════════╗
║   PetroKens Live Stock Server v3.0    ║
╠════════════════════════════════════════╣
║  📡 Finnhub API Integration            ║
║  🚀 Fast & Reliable Data               ║
║  🔄 30s Cache & Broadcast              ║
╚════════════════════════════════════════╝

📊 Data Provider: Finnhub.io
🔑 API Key: d41l1t1r01...

🚀 Server running on http://localhost:3000
📈 Monitoring 50 NIFTY 50 stocks
🔌 WebSocket ready for connections
📊 Broadcasting updates every 30 seconds
⚡ Using Finnhub API (No rate limit issues!)

🔄 Starting broadcast cycle...
✅ RELIANCE: ₹2450.80 (+0.51%)
✅ TCS: ₹3567.25 (-0.32%)
✅ HDFCBANK: ₹1645.90 (+1.23%)
📊 Progress: 10/50 stocks (10 successful)
...
✅ Broadcast complete: 48/50 stocks in 35.2s
👥 Connected clients: 1
```

## 🛠️ Troubleshooting

### No data for some stocks
- Some Indian stocks may have limited data on Finnhub
- Check symbol format (should be `SYMBOL.NS` for NSE)
- Verify stock is actively traded

### Rate limit errors
- Increase delay between requests
- Decrease broadcast frequency
- Consider upgrading API plan

### WebSocket not connecting
- Check CORS settings
- Verify port 3000 is not blocked
- Ensure frontend is using correct URL

## 📚 Resources

- **Finnhub Documentation**: https://finnhub.io/docs/api
- **API Key Management**: https://finnhub.io/dashboard
- **Socket.IO Docs**: https://socket.io/docs/v4/

---

**Result:** A fast, reliable backend that provides progressive real-time stock updates without authentication issues! 🚀
