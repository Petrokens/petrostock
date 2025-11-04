# Filter Guide - Professional Trading Dashboard

## All Filters Are Now Working! ✅

### 1. **Sort Dropdown** (Price ↓)
Sorts stocks by:
- **Price ↓** - Highest price first
- **Change % ↓** - Highest percentage change first
- **Buy Qty ↓** - Highest buy volume first
- **Sell Qty ↓** - Highest sell volume first
- **B/S Ratio ↓** - Highest buy/sell ratio first

### 2. **Filter Dropdown** (All Stocks)
Filters by stock performance:
- **All Stocks** - Shows all stocks
- **Gainers 📈** - Only stocks with positive change (green)
- **Losers 📉** - Only stocks with negative change (red)

### 3. **Ratio Filter** (All Ratios)
Filters by Buy/Sell ratio:
- **All Ratios** - Shows all stocks
- **High Buy 🟢** - B/S ratio > 1.5 (more buyers)
- **Balanced ⚪** - B/S ratio between 0.8 and 1.2
- **High Sell 🔴** - B/S ratio < 0.67 (more sellers)

### 4. **Quantity Filter** (All Qty)
Filters by buy/sell volume:
- **All Qty** - Shows all stocks
- **High Buy Qty 🟢** - Buy volume > Sell volume × 1.5
- **High Sell Qty 🔴** - Sell volume > Buy volume × 1.5
- **Balanced Qty ⚪** - Buy/Sell volumes are balanced (0.8-1.2 ratio)

## How It Works:
- Filters work together (AND logic)
- Only shows stocks with **live data** when using ratio/qty filters
- Shows "No stocks match" message if filters are too restrictive
- Header shows filtered count: "Watchlist (X of Y)"

## To Start Server:
1. **Windows**: Double-click `server/START.bat`
2. **PowerShell**: Run `cd server; node index.js`
3. **PowerShell Script**: Run `.\server\START.ps1`

Then refresh your React app to see live data!

