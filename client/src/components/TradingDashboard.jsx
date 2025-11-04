import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Search,
  Filter,
  X,
  Maximize2,
  Activity,
  DollarSign,
  Users,
  Clock
} from 'lucide-react';
import LiveTradingChart from './LiveTradingChart';

const TradingDashboard = () => {
  const [selectedStock, setSelectedStock] = useState('KOTAKBANK');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketData, setMarketData] = useState({});
  const [orderBook, setOrderBook] = useState({ buy: [], sell: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  // Nifty 200 Indian stocks
  const nifty200Stocks = [
    'KOTAKBANK', 'ICICIBANK', 'HDFCBANK', 'SBIN', 'AXISBANK',
    'RELIANCE', 'TCS', 'INFY', 'WIPRO', 'HCL',
    'MARUTI', 'TATAMOTORS', 'BAJFINANCE', 'HDFCLIFE', 'SBILIFE',
    'ADANIPORTS', 'ASIANPAINT', 'BRITANNIA', 'COALINDIA', 'DRREDDY',
    'EICHERMOT', 'GRASIM', 'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR',
    'ITC', 'JSWSTEEL', 'KOTAKBANK', 'LT', 'M&M',
    'NESTLEIND', 'NTPC', 'ONGC', 'POWERGRID', 'SUNPHARMA',
    'TATACONSUM', 'TATASTEEL', 'TECHM', 'TITAN', 'ULTRACEMCO'
  ];

  // Generate realistic Indian stock data
  const generateStockData = useCallback(() => {
    const data = {};
    nifty200Stocks.forEach(symbol => {
      const basePrice = Math.random() * 3000 + 100; // Between ₹100-₹3100
      const change = (Math.random() - 0.5) * 100; // ±₹50 change
      const changePercent = (change / basePrice) * 100;
      
      data[symbol] = {
        symbol,
        price: basePrice,
        change,
        changePercent,
        high: basePrice + Math.abs(change) + Math.random() * 20,
        low: basePrice - Math.abs(change) - Math.random() * 20,
        volume: Math.floor(Math.random() * 10000000) + 100000,
        ltp: basePrice + (Math.random() - 0.5) * 5,
        bid: basePrice - Math.random() * 2,
        ask: basePrice + Math.random() * 2,
        oi: Math.floor(Math.random() * 1000000),
        timestamp: Date.now()
      };
    });
    return data;
  }, []);

  // Generate order book data
  const generateOrderBook = useCallback(() => {
    const buyOrders = [];
    const sellOrders = [];
    
    for (let i = 0; i < 5; i++) {
      const basePrice = marketData[selectedStock]?.price || 2000;
      buyOrders.push({
        price: (basePrice - (i + 1) * 0.5).toFixed(2),
        qty: Math.floor(Math.random() * 10000) + 100,
        orders: Math.floor(Math.random() * 50) + 1
      });
      sellOrders.push({
        price: (basePrice + (i + 1) * 0.5).toFixed(2),
        qty: Math.floor(Math.random() * 10000) + 100,
        orders: Math.floor(Math.random() * 50) + 1
      });
    }
    
    return { buy: buyOrders, sell: sellOrders };
  }, [selectedStock, marketData]);

  // Update market data every 2 seconds
  useEffect(() => {
    const updateData = () => {
      setMarketData(generateStockData());
      setCurrentTime(new Date());
    };
    
    updateData(); // Initial load
    const interval = setInterval(updateData, 2000);
    return () => clearInterval(interval);
  }, [generateStockData]);

  // Update order book every 3 seconds
  useEffect(() => {
    const updateOrderBook = () => {
      setOrderBook(generateOrderBook());
    };
    
    updateOrderBook();
    const interval = setInterval(updateOrderBook, 3000);
    return () => clearInterval(interval);
  }, [generateOrderBook]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(2) + 'Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTopMovers = () => {
    const stocks = Object.values(marketData);
    const gainers = stocks.filter(s => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
    const losers = stocks.filter(s => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);
    return { gainers, losers };
  };

  const selectedStockData = marketData[selectedStock];
  const { gainers, losers } = getTopMovers();

  return (
    <div className="trading-dashboard">
      {/* Header */}
      <header className="trading-header">
        <div className="header-left">
          <div className="logo-section">
            <BarChart3 size={24} className="logo-icon" />
            <span className="app-name">PetroStock Market</span>
          </div>
          
          <div className="nifty-info">
            <span className="index-name">NIFTY 50</span>
            <span className="index-value">19,425.30</span>
            <span className="index-change positive">+145.80 (+0.76%)</span>
          </div>
        </div>

        <div className="header-center">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="header-right">
          <div className="market-status">
            <div className={`status-dot ${isMarketOpen ? 'open' : 'closed'}`}></div>
            <span className="status-text">{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
          </div>
          
          <div className="current-time">
            <Clock size={16} />
            <span>{currentTime.toLocaleTimeString('en-IN')}</span>
          </div>

          <button className="refresh-btn">
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="trading-content">
        {/* Sidebar - Watchlist */}
        <aside className="watchlist-panel">
          <div className="panel-header">
            <h3>Watchlist</h3>
            <Filter size={16} />
          </div>
          
          <div className="stock-list">
            {nifty200Stocks.slice(0, 15).map(symbol => {
              const stock = marketData[symbol];
              if (!stock) return null;
              
              return (
                <div 
                  key={symbol}
                  className={`stock-item ${selectedStock === symbol ? 'selected' : ''}`}
                  onClick={() => setSelectedStock(symbol)}
                >
                  <div className="stock-symbol">{symbol}</div>
                  <div className="stock-price">{formatCurrency(stock.ltp)}</div>
                  <div className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Trading Panel */}
        <main className="main-trading-panel">
          {/* Stock Header */}
          {selectedStockData && (
            <div className="stock-header">
              <div className="stock-info">
                <h2 className="stock-name">{selectedStock}</h2>
                <div className="stock-details">
                  <span className="current-price">{formatCurrency(selectedStockData.ltp)}</span>
                  <span className={`price-change ${selectedStockData.change >= 0 ? 'positive' : 'negative'}`}>
                    {selectedStockData.change >= 0 ? '+' : ''}{formatCurrency(selectedStockData.change)}
                    ({selectedStockData.change >= 0 ? '+' : ''}{selectedStockData.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              
              <div className="stock-stats">
                <div className="stat">
                  <span className="label">High</span>
                  <span className="value">{formatCurrency(selectedStockData.high)}</span>
                </div>
                <div className="stat">
                  <span className="label">Low</span>
                  <span className="value">{formatCurrency(selectedStockData.low)}</span>
                </div>
                <div className="stat">
                  <span className="label">Volume</span>
                  <span className="value">{formatNumber(selectedStockData.volume)}</span>
                </div>
                <div className="stat">
                  <span className="label">OI</span>
                  <span className="value">{formatNumber(selectedStockData.oi)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Trading Chart */}
          <div className="chart-container">
            <LiveTradingChart
              symbol={selectedStock}
              price={selectedStockData?.price}
              change={selectedStockData?.change}
              changePercent={selectedStockData?.changePercent}
            />
          </div>

          {/* Order Book */}
          <div className="order-book">
            <h4>Market Depth</h4>
            <div className="depth-table">
              <div className="buy-side">
                <div className="side-header buy-header">
                  <span>Bid</span>
                  <span>Qty</span>
                  <span>Orders</span>
                </div>
                {orderBook.buy.map((order, index) => (
                  <div key={index} className="order-row buy-row">
                    <span className="price">{order.price}</span>
                    <span className="qty">{formatNumber(order.qty)}</span>
                    <span className="orders">{order.orders}</span>
                  </div>
                ))}
              </div>
              
              <div className="sell-side">
                <div className="side-header sell-header">
                  <span>Ask</span>
                  <span>Qty</span>
                  <span>Orders</span>
                </div>
                {orderBook.sell.map((order, index) => (
                  <div key={index} className="order-row sell-row">
                    <span className="price">{order.price}</span>
                    <span className="qty">{formatNumber(order.qty)}</span>
                    <span className="orders">{order.orders}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - Market Summary */}
        <aside className="market-summary-panel">
          <div className="summary-stats">
            <div className="stat-card">
              <DollarSign className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">₹45.2L</span>
                <span className="stat-label">Portfolio Value</span>
              </div>
            </div>
            
            <div className="stat-card">
              <TrendingUp className="stat-icon positive" />
              <div className="stat-content">
                <span className="stat-value positive">+2.4%</span>
                <span className="stat-label">Day's P&L</span>
              </div>
            </div>
            
            <div className="stat-card">
              <Users className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">{nifty200Stocks.length}</span>
                <span className="stat-label">Stocks Tracked</span>
              </div>
            </div>
          </div>

          {/* Top Gainers */}
          <div className="movers-section">
            <h4 className="section-title">
              <TrendingUp size={16} className="section-icon positive" />
              Top Gainers
            </h4>
            <div className="movers-list">
              {gainers.map(stock => (
                <div key={stock.symbol} className="mover-item">
                  <span className="mover-symbol">{stock.symbol}</span>
                  <span className="mover-change positive">+{stock.changePercent.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="movers-section">
            <h4 className="section-title">
              <TrendingDown size={16} className="section-icon negative" />
              Top Losers
            </h4>
            <div className="movers-list">
              {losers.map(stock => (
                <div key={stock.symbol} className="mover-item">
                  <span className="mover-symbol">{stock.symbol}</span>
                  <span className="mover-change negative">{stock.changePercent.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TradingDashboard;