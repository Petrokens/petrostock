# 🚀 Quick Start Guide - PetroKens Stock Market

## Windows Users

### Option 1: Automatic (Recommended)

1. **Start Backend Server** (for live data)
   ```
   Double-click: START_BACKEND.bat
   ```
   Keep this window open!

2. **Start Frontend** (in a NEW terminal)
   ```
   npm run dev
   ```

3. **Open Browser**
   ```
   http://localhost:5173
   ```

### Option 2: Manual

**Terminal 1 - Backend:**
```cmd
cd D:\react_stock
npm install express node-fetch@3 cors memory-cache socket.io
node server.js
```

**Terminal 2 - Frontend:**
```cmd
cd D:\react_stock
npm run dev
```

---

## Linux/Mac Users

**Terminal 1 - Backend:**
```bash
cd ~/react_stock
npm install express node-fetch@3 cors memory-cache socket.io
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd ~/react_stock
npm run dev
```

---

## ✨ What You'll See

1. **Backend Terminal:**
   ```
   🚀 Live server on http://localhost:3000
   📈 Monitoring 50 NIFTY 50 stocks
   🔄 Refreshing NSE session cookies...
   ✅ NSE cookies refreshed successfully
   📊 Broadcasted 50 stock updates
   ```

2. **Frontend Terminal:**
   ```
   VITE v5.x ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

3. **Browser:**
   - Purple **PetroKens** button (top-left)
   - **LIVE** green badge (when backend connected)
   - Real-time stock data updating every 15 seconds

---

## 🎯 Using the Dashboard

### 1. Select Index
Click **PetroKens** button → Choose:
- 📊 NIFTY 50
- 📈 NIFTY 100  
- 📉 NIFTY 200
- 💹 NIFTY 500
- 🎯 MIDCAP 100
- 🔥 SMALLCAP 100

### 2. Sort Stocks
First dropdown:
- **Price** - Highest prices first
- **Change %** - Biggest movers
- **Volume** - Most traded
- **B/S Ratio** - Bullish stocks
- **S/B Ratio** - Bearish stocks

### 3. Filter
Second dropdown:
- **All Stocks** - Show all
- **Gainers Only** - Green stocks only
- **Losers Only** - Red stocks only

### 4. Search
Type company name or symbol in search bar

### 5. View Details
Click any stock to see:
- Live chart
- Buy/Sell volumes
- B/S & S/B ratios
- Market stats

---

## ⚠️ Troubleshooting

### Backend Won't Start?
```bash
# Install dependencies manually
npm install express node-fetch@3 cors memory-cache socket.io

# Then start
node server.js
```

### Frontend Shows "DEMO" Instead of "LIVE"?
- Make sure backend is running in another terminal
- Check backend terminal for errors
- Refresh the browser page

### No Data Showing?
- Wait 2-3 seconds after page load
- The app falls back to demo data automatically
- Demo data is perfectly fine for testing!

### NSE API Rate Limited?
- Normal during market hours
- Backend will retry automatically
- Data updates every 15 seconds

---

## 📊 Data Updates

- **Backend**: Fetches from NSE every 15 seconds
- **Frontend**: Updates UI in real-time via WebSocket
- **Cache**: 10 second cache per stock (reduces API load)

---

## 🎨 Features

✅ 6 different index views  
✅ Real-time live data from NSE  
✅ Buy/Sell volume tracking  
✅ B/S & S/B ratio analysis  
✅ Advanced sorting & filtering  
✅ Search functionality  
✅ Top gainers & losers  
✅ Live charts  
✅ Market hours tracking  
✅ Responsive design  

---

## 🔧 Ports Used

- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3000 (Express + Socket.IO)

---

## 📝 Notes

1. **Backend is optional** - App works with demo data
2. **Market hours**: 9:15 AM - 3:30 PM IST (Mon-Fri)
3. **NSE data**: ~15 second delay (not tick-by-tick)
4. **B/S ratios**: Estimated from volume patterns

---

## 🎉 Enjoy!

You now have a fully functional stock market dashboard with:
- Real-time NSE data
- Multiple index views  
- Advanced analytics
- Beautiful UI

**Happy Trading! 📈🚀**


