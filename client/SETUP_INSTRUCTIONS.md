# PetroKens Stock Market Dashboard - Setup Instructions

## 🚀 Features Implemented

### ✅ Index Selector Dropdown
- **PetroKens Logo** with dropdown menu
- 6 Index options:
  - 📊 NIFTY 50 (50 stocks)
  - 📈 NIFTY 100 (100 stocks)
  - 📉 NIFTY 200 (200 stocks)
  - 💹 NIFTY 500 (500 stocks)
  - 🎯 NIFTY MIDCAP 100 (100 stocks)
  - 🔥 NIFTY SMALLCAP 100 (100 stocks)

### ✅ Enhanced Stock Data Display
Each stock shows:
- Company Name
- Market Price (1D)
- Change Percentage
- **Buy Volume**
- **Sell Volume**
- **B/S Ratio** (Buy/Sell Ratio)
- **S/B Ratio** (Sell/Buy Ratio)

### ✅ Advanced Filtering & Sorting
Sort options:
- Price (High to Low)
- Change % (High to Low)
- Volume (High to Low)
- **B/S Ratio (High to Low)**
- **S/B Ratio (High to Low)**

Filter options:
- All Stocks
- Gainers Only
- Losers Only

### ✅ Live Data Integration
- **Socket.IO** connection to backend server
- Real-time price updates every 15 seconds
- Automatic fallback to demo data if backend is unavailable
- Live badge indicator when connected to backend

---

## 🛠️ Backend Setup (For Live Data)

### 1. Create Backend Server File
Create a file named `server.js` in your project root with the backend code you provided:

```bash
# Create server.js with the NSE API integration code
```

### 2. Install Backend Dependencies
```bash
npm install express node-fetch cors memory-cache socket.io
```

### 3. Start Backend Server
```bash
# Open a separate terminal
node server.js
```

The backend will start on `http://localhost:3000` and:
- Fetch live data from NSE India
- Cache data for 10 seconds
- Broadcast updates every 15 seconds via WebSocket
- Handle rate limiting automatically

---

## 🎨 Frontend Setup

### 1. Install Dependencies (Already Done)
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

---

## 📊 How to Use

### 1. **Select an Index**
- Click on the **PetroKens** logo/button in the top-left
- Choose from 6 index options
- The watchlist will automatically load all stocks from that index

### 2. **Sort Stocks**
- Use the first dropdown to sort by:
  - Price
  - Change %
  - Volume
  - B/S Ratio (Bullish indicator - higher is better)
  - S/B Ratio (Bearish indicator - lower is better)

### 3. **Filter Stocks**
- Use the second dropdown:
  - **All Stocks** - Show everything
  - **Gainers Only** - Only positive change %
  - **Losers Only** - Only negative change %

### 4. **Search Stocks**
- Use the search bar to find specific companies
- Search by symbol or company name

### 5. **View Details**
- Click on any stock to see:
  - Live chart
  - High/Low prices
  - Buy/Sell volumes
  - B/S and S/B ratios
  - Market Cap, P/E, P/B ratios

---

## 🔄 Data Modes

### Live Mode (Backend Connected)
- Shows **"LIVE"** badge in green
- Real data from NSE India API
- Updates every 15 seconds
- B/S ratios estimated from volume patterns

### Demo Mode (Backend Not Available)
- Shows **"DEMO"** badge in orange
- Realistic simulated data
- Updates dynamically
- Perfect for testing and development

---

## 📈 Understanding B/S and S/B Ratios

### B/S Ratio (Buy/Sell Ratio)
```
B/S Ratio = Buy Volume / Sell Volume
```
- **> 1.0** = More buyers than sellers (Bullish)
- **< 1.0** = More sellers than buyers (Bearish)
- **= 1.0** = Balanced

### S/B Ratio (Sell/Buy Ratio)
```
S/B Ratio = Sell Volume / Buy Volume
```
- **< 1.0** = More buyers (Bullish)
- **> 1.0** = More sellers (Bearish)
- **= 1.0** = Balanced

---

## 🎯 Market Hours

**NSE Trading Hours (IST):**
- **Pre-Market**: 9:00 AM - 9:15 AM
- **Market Open**: 9:15 AM - 3:30 PM
- **Post-Market**: 3:30 PM - 4:00 PM

The dashboard shows:
- ✅ **Green dot** - Market is OPEN
- 🔴 **Red dot** - Market is CLOSED
- Countdown timer until next market session

---

## 🔧 Configuration

### Backend URL
If your backend is on a different port or server, update the URL in:
```javascript
// src/services/stockService.js
this.backendUrl = 'http://localhost:3000'; // Change this
```

### Cache Duration
```javascript
// src/services/stockService.js
Config.CACHE_TTL = 60000; // 60 seconds (adjust as needed)
```

---

## 🐛 Troubleshooting

### Issue: "Backend connection error"
**Solution**: Make sure backend server is running:
```bash
node server.js
```

### Issue: "No data showing"
**Solution**: The app will automatically fall back to demo data. This is normal if:
- Backend is not running
- NSE API is rate-limited
- Network issues

### Issue: "B/S ratios not updating"
**Solution**: 
- NSE doesn't provide direct buy/sell split
- Ratios are estimated from volume patterns
- More accurate during live market hours

---

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- 💻 Desktop (optimized)
- 📱 Tablet
- 📱 Mobile (basic support)

---

## 🎨 UI Features

- **Gradient Logo Button** - Purple gradient with hover effects
- **Animated Dropdown** - Smooth transitions
- **Live Indicators** - Pulsing live badges
- **Color-coded Changes** - Green for gains, Red for losses
- **Interactive Charts** - Click to view detailed charts
- **Top Movers** - Auto-updating gainers and losers

---

## 🚀 Next Steps

1. ✅ Start backend server
2. ✅ Start frontend
3. ✅ Select your preferred index
4. ✅ Sort and filter stocks
5. ✅ Click stocks to view details

**Enjoy real-time stock market tracking! 📊📈**


