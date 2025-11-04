# 🎯 Complete Setup & Usage Guide - PetroKens Stock Market

## 🚀 Quick Start (2 Terminals)

### Terminal 1: Start Backend Server

```bash
cd D:\react_stock\server
npm install
npm start
```

**Or double-click:** `server/START.bat` (Windows)

You'll see:
```
╔════════════════════════════════════════╗
║   PetroKens Live Stock Server v1.0    ║
╚════════════════════════════════════════╝

🚀 Server running on http://localhost:3000
📈 Monitoring 50 NIFTY 50 stocks
🔌 WebSocket ready for connections
📊 Broadcasting updates every 15 seconds
```

### Terminal 2: Start Frontend

```bash
cd D:\react_stock
npm run dev
```

Open: http://localhost:5173

---

## ✨ New Features Implemented

### 1. **Wider Watchlist** (480px)
- More space for company details
- Better readability
- Room for all information

### 2. **Company Display**
- **Logo badge** with first letter
- **Company name** (full name)
- **Symbol** (e.g., TCS)
- Star button to add to favorites

### 3. **Buy:Sell Ratio Display**
Shows ratios like **10:1** or **3:2**
- **10:1** = 10 buyers for every 1 seller (Very Bullish 🟢)
- **3:1** = 3 buyers for every 1 seller (Bullish 🟢)
- **1:1** = Balanced (Neutral ⚪)
- **1:3** = 1 buyer for every 3 sellers (Bearish 🔴)
- **1:10** = 1 buyer for every 10 sellers (Very Bearish 🔴)

### 4. **Color-Coded Ratio Badges**
- 🟢 **Green Badge** = High Buy Ratio (ratio > 1.2)
- ⚪ **Blue Badge** = Balanced (0.8 - 1.2)
- 🔴 **Red Badge** = High Sell Ratio (ratio < 0.8)

### 5. **Advanced Filters** (3 Dropdowns)

**Dropdown 1: Sort By**
- Price ↓ (Highest first)
- Change % ↓ (Biggest movers)
- Volume ↓ (Most traded)
- Buy Ratio ↓ (Strongest buying pressure)

**Dropdown 2: Price Filter**
- All Stocks
- Gainers Only (positive change)
- Losers Only (negative change)

**Dropdown 3: Ratio Filter** ⭐ NEW!
- **All Ratios** - Show everything
- **High Buy 🟢** - Only stocks with strong buying (B/S > 1.5)
- **Balanced ⚪** - Neutral stocks (0.8 < B/S < 1.2)
- **High Sell 🔴** - Only stocks with strong selling (B/S < 0.67)

---

## 📊 Understanding the Dashboard

### Watchlist Columns:

| Company | Price (1D) | Volume | Buy:Sell |
|---------|-----------|--------|----------|
| Logo + Name + Symbol | Current Price + Change% | Trading Volume | Ratio Badge |

### Example Row:

```
[R] Reliance Industries    ₹2,450.80      9.34Cr     [10:3] 🟢
    RELIANCE               +2.50 (1.03%)             Buy:Sell
```

This means:
- **Reliance** trading at ₹2,450.80
- Up **1.03%** today (gainer)
- Volume: **9.34 Crores**
- Buy:Sell ratio: **10:3** (10 buyers for every 3 sellers - BULLISH!)

---

## 🎯 Use Cases

### Find Strong Buying Opportunities

1. Click **Ratio Filter** → **High Buy 🟢**
2. Click **Sort** → **Buy Ratio ↓**
3. See stocks with strongest buying pressure
4. Look for 🟢 green badges
5. Ratios like **8:1**, **10:2** indicate strong demand

### Find Stocks Under Selling Pressure

1. Click **Ratio Filter** → **High Sell 🔴**
2. Click **Sort** → **Buy Ratio ↓** (will show lowest first)
3. See stocks with strongest selling pressure
4. Look for 🔴 red badges
5. Ratios like **1:8**, **2:10** indicate heavy selling

### Find Balanced Stocks

1. Click **Ratio Filter** → **Balanced ⚪**
2. These are stocks with equal buy/sell pressure
3. Good for range trading or breakout setups

### Find Top Movers with Strong Buying

1. Click **Price Filter** → **Gainers Only**
2. Click **Ratio Filter** → **High Buy 🟢**
3. Click **Sort** → **Change % ↓**
4. See stocks that are both rising AND have buying pressure

---

## 📈 Live Data Features

### When Backend is Connected (LIVE):
- Real NSE India data
- Updates every 15 seconds
- Actual buy/sell volumes from market
- Green **"LIVE"** badge visible

### Data Flow:
```
NSE India API
    ↓
Your Backend Server (localhost:3000)
    ↓
WebSocket Broadcast
    ↓
Frontend Dashboard
    ↓
Live Updates in Watchlist
```

### Buy/Sell Calculation:
```javascript
// Backend estimates from total volume
buyVolume = totalVolume * (40-60%)
sellVolume = totalVolume * (40-60%)

// Ratio calculation
B/S Ratio = buyVolume / sellVolume

// Display format
if (B/S = 2.5) → Show as "5:2"
if (B/S = 0.5) → Show as "1:2"
```

---

## 🎨 Visual Guide

### Stock Item Layout:

```
┌───────────────────────────────────────────────────────┐
│ [R] Reliance Industries  ₹2,450.80    9.34Cr  [10:3]│
│     RELIANCE             +1.03%              🟢       │
│                                            Buy:Sell   │
└───────────────────────────────────────────────────────┘
  ↑     ↑                   ↑          ↑        ↑
  Logo  Name               Price    Volume    Ratio
        Symbol             Change            Badge
```

### Ratio Badge Colors:

```
┌─────────┐        ┌─────────┐        ┌─────────┐
│ Buy:Sell│        │ Buy:Sell│        │ Buy:Sell│
│  [10:1] │        │  [1:1]  │        │  [1:10] │
│    🟢   │        │    ⚪   │        │    🔴   │
└─────────┘        └─────────┘        └─────────┘
 Bullish           Balanced           Bearish
 (B/S > 1.2)       (0.8-1.2)         (B/S < 0.8)
```

---

## 🔥 Pro Tips

### 1. **Find Breakout Stocks**
- Filter: **Gainers Only**
- Ratio: **High Buy 🟢**
- Sort: **Volume ↓**
- Look for: High volume + High buy ratio + Positive change

### 2. **Find Reversal Candidates**
- Filter: **Losers Only**
- Ratio: **High Buy 🟢**
- Look for: Stocks falling but buying increasing

### 3. **Avoid Weak Stocks**
- Filter: **Gainers Only**
- Ratio: **High Sell 🔴**
- Warning: Rising on weak buying (may reverse)

### 4. **Monitor Index Rotation**
- Switch between NIFTY 50, 100, 200
- Compare buy ratios across indices
- Find where money is flowing

---

## 🛠️ Troubleshooting

### "No Live Data"
- Check if server is running (`localhost:3000`)
- Open backend terminal - should see broadcasts
- Refresh browser page

### "DEMO Badge Instead of LIVE"
- Backend not connected
- Start server in separate terminal
- Wait 2-3 seconds for connection

### "Ratios Not Updating"
- Check backend console for errors
- NSE might be rate limiting
- Normal during heavy traffic

### "Empty Watchlist"
- Wait for initial data load (2-5 seconds)
- Check console for errors (F12)
- Try selecting different index

---

## 📱 Keyboard Shortcuts

- `Ctrl+F` - Focus search bar
- `F5` - Refresh data
- `Esc` - Close dropdown menus
- Click stock - View details

---

## 🎯 Trading Strategies Using Buy/Sell Ratios

### Strategy 1: Momentum Trading
1. Filter: **Gainers** + **High Buy 🟢**
2. Sort by **Volume**
3. Enter on pullbacks
4. Exit when ratio turns balanced

### Strategy 2: Contrarian Plays
1. Filter: **Losers** + **High Buy 🟢**
2. Look for reversal patterns
3. Entry when price stabilizes
4. Target: Previous support

### Strategy 3: Scalping
1. Filter: **Balanced ⚪**
2. Sort by **Volume**
3. Quick in-out trades
4. Target 0.5-1% moves

---

## 📊 Server Information

### Monitored Stocks (50):
RELIANCE, TCS, HDFCBANK, ICICIBANK, INFY, ITC, LT, SBIN, BHARTIARTL, HINDUNILVR, ASIANPAINT, AXISBANK, BAJFINANCE, BAJAJFINSV, MARUTI, M&M, HCLTECH, ULTRACEMCO, KOTAKBANK, SUNPHARMA, TITAN, NESTLEIND, WIPRO, POWERGRID, ADANIENT, ADANIPORTS, JSWSTEEL, TATASTEEL, NTPC, ONGC, COALINDIA, GRASIM, BRITANNIA, TATAMOTORS, TATACONSUM, HEROMOTOCO, DRREDDY, HDFCLIFE, DIVISLAB, EICHERMOT, BAJAJ-AUTO, HINDALCO, CIPLA, LTIM, SHRIRAMFIN, TECHM, BPCL, IOC, SBILIFE, UPL

### Server Endpoints:
- `GET /` - Health check
- `GET /api/quote?symbol=RELIANCE` - Single stock
- `WebSocket` - Live updates

---

## 🎉 You're Ready!

1. ✅ Start backend server
2. ✅ Start frontend
3. ✅ Open browser
4. ✅ Select index
5. ✅ Apply filters
6. ✅ Find trading opportunities!

**Happy Trading! 📈🚀**


