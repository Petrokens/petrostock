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
  ChevronDown,
  Star,
  ArrowUpDown
} from 'lucide-react';
import LiveChart from './LiveChart';
import stockService from '../services/stockService';
import { NIFTY_INDICES, INDEX_OPTIONS } from '../data/indexData';

const ProfessionalTradingDashboard = () => {
  const [selectedStock, setSelectedStock] = useState('RELIANCE');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketData, setMarketData] = useState({});
  const [selectedIndex, setSelectedIndex] = useState('NIFTY 50');
  const [showIndexDropdown, setShowIndexDropdown] = useState(false);
  const [watchlist, setWatchlist] = useState(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [filterBy, setFilterBy] = useState('all');
  const [ratioFilter, setRatioFilter] = useState('all'); // 'all', 'highBuy', 'balanced', 'highSell'
  const [qtyFilter, setQtyFilter] = useState('all'); // 'all', 'highBuyQty', 'highSellQty'
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [niftyData, setNiftyData] = useState({
    name: 'NIFTY 50',
    value: 19425.30,
    change: 145.80,
    changePercent: 0.76
  });

  // Get current index stocks
  const currentIndexStocks = NIFTY_INDICES[selectedIndex]?.stocks || [];

  // Connect to live backend on mount
  useEffect(() => {
    console.log('🔌 Connecting to live backend server...');
    stockService.connectToLiveBackend();

    // Subscribe to live updates (progressive, stock-by-stock)
    const unsubscribe = stockService.onLiveDataUpdate((updates) => {
      console.log(`📊 Received ${updates.length} live update(s)`);
      setMarketData(prevData => {
        const newData = { ...prevData };
        updates.forEach(update => {
          // Always update, even if not in current data (might be new)
          newData[update.symbol] = {
            ...(newData[update.symbol] || {}),
            ...update,
            isLiveData: true // Mark as live
          };
          
          // Log individual updates for visibility
          if (update.isLiveData && update.price) {
            console.log(`✨ Live update: ${update.symbol} @ ₹${update.price}`);
          }
        });
        return newData;
      });
    });

    // When connected, automatically subscribe to current index stocks
    const unsubscribeConnection = stockService.onConnection(() => {
      console.log('🔔 Connection established, subscribing to stocks...');
      const stocks = currentIndexStocks;
      if (stocks.length > 0) {
        stockService.subscribeToStocks(stocks);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeConnection();
      stockService.disconnectFromBackend();
    };
  }, [currentIndexStocks]);

  // Load NIFTY index data
  const loadNiftyData = useCallback(async () => {
    try {
      const indexData = await stockService.fetchNiftyIndexData();
      if (indexData) {
        setNiftyData(indexData);
      }
    } catch (error) {
      console.error('Error loading NIFTY data:', error);
    }
  }, []);

  // Load stock data for selected index
  const loadStockData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`📊 Loading ${selectedIndex} stocks...`);
      
      const stocks = currentIndexStocks;
      
      // Load cached data first (instant display)
      const cachedData = await stockService.fetchMultipleStocks(stocks);
      setMarketData(cachedData);
      setIsLoading(false);
      
      // If connected to backend, subscribe to all stocks for live updates
      if (stockService.isConnectedToBackend) {
        console.log(`🔔 Subscribing to ${stocks.length} stocks via WebSocket...`);
        stockService.subscribeToStocks(stocks);
        console.log(`✅ Subscribed, waiting for live updates...`);
      } else {
        console.log('⚠️ Not connected to backend, will subscribe when connected');
        // Subscribe when connection is established
        stockService.onConnection(() => {
          console.log(`🔔 Backend connected, subscribing to ${stocks.length} stocks...`);
          stockService.subscribeToStocks(stocks);
        });
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
      setIsLoading(false);
    }
  }, [selectedIndex, currentIndexStocks]);

  // Load data on index change
  useEffect(() => {
    loadStockData();
    loadNiftyData();
  }, [loadStockData, loadNiftyData]);

  // Update clock and market status
  useEffect(() => {
    const updateTimeAndMarketStatus = () => {
      setCurrentTime(new Date());
      const marketOpen = stockService.isMarketOpen();
      setIsMarketOpen(marketOpen);
    };

    updateTimeAndMarketStatus();
    const timer = setInterval(updateTimeAndMarketStatus, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter and sort stocks
  const getFilteredAndSortedStocks = () => {
    let stocks = currentIndexStocks.filter(symbol => 
      symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      marketData[symbol]?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply filters
    if (filterBy === 'gainers') {
      stocks = stocks.filter(symbol => {
        const changePercent = parseFloat(marketData[symbol]?.changePercent) || 0;
        return changePercent > 0 && marketData[symbol]?.isLiveData;
      });
    } else if (filterBy === 'losers') {
      stocks = stocks.filter(symbol => {
        const changePercent = parseFloat(marketData[symbol]?.changePercent) || 0;
        return changePercent < 0 && marketData[symbol]?.isLiveData;
      });
    }

    // Apply ratio filters
    if (ratioFilter === 'highBuy') {
      // Show stocks where buy > sell (B/S ratio > 1.5)
      stocks = stocks.filter(symbol => {
        const ratio = parseFloat(marketData[symbol]?.bsRatio) || 0;
        return ratio > 1.5 && marketData[symbol]?.isLiveData;
      });
    } else if (ratioFilter === 'balanced') {
      // Show balanced stocks (0.8 < B/S < 1.2)
      stocks = stocks.filter(symbol => {
        const ratio = parseFloat(marketData[symbol]?.bsRatio) || 0;
        return ratio > 0.8 && ratio < 1.2 && marketData[symbol]?.isLiveData;
      });
    } else if (ratioFilter === 'highSell') {
      // Show stocks where sell > buy (B/S ratio < 0.67)
      stocks = stocks.filter(symbol => {
        const ratio = parseFloat(marketData[symbol]?.bsRatio) || 0;
        return ratio < 0.67 && ratio > 0 && marketData[symbol]?.isLiveData;
      });
    }

    // Apply quantity filters
    if (qtyFilter === 'highBuyQty') {
      // Show stocks where buy quantity is dominant
      stocks = stocks.filter(symbol => {
        const buyVol = marketData[symbol]?.buyVolume || 0;
        const sellVol = marketData[symbol]?.sellVolume || 0;
        return buyVol > sellVol * 1.5 && marketData[symbol]?.isLiveData && buyVol > 0;
      });
    } else if (qtyFilter === 'highSellQty') {
      // Show stocks where sell quantity is dominant
      stocks = stocks.filter(symbol => {
        const buyVol = marketData[symbol]?.buyVolume || 0;
        const sellVol = marketData[symbol]?.sellVolume || 0;
        return sellVol > buyVol * 1.5 && marketData[symbol]?.isLiveData && sellVol > 0;
      });
    } else if (qtyFilter === 'balancedQty') {
      // Show balanced quantity stocks
      stocks = stocks.filter(symbol => {
        const buyVol = marketData[symbol]?.buyVolume || 0;
        const sellVol = marketData[symbol]?.sellVolume || 0;
        if (buyVol === 0 || sellVol === 0 || !marketData[symbol]?.isLiveData) return false;
        const ratio = buyVol / sellVol;
        return ratio > 0.8 && ratio < 1.2;
      });
    }

    // Apply sorting - prioritize stocks with live data
    stocks.sort((a, b) => {
      const dataA = marketData[a];
      const dataB = marketData[b];
      
      // Put stocks with live data first
      if (dataA?.isLiveData && !dataB?.isLiveData) return -1;
      if (!dataA?.isLiveData && dataB?.isLiveData) return 1;
      
      if (!dataA || !dataB) return 0;

      switch (sortBy) {
        case 'price':
          return (parseFloat(dataB.price) || 0) - (parseFloat(dataA.price) || 0);
        case 'change':
          return (parseFloat(dataB.changePercent) || 0) - (parseFloat(dataA.changePercent) || 0);
        case 'volume':
          return (parseFloat(dataB.volume) || 0) - (parseFloat(dataA.volume) || 0);
        case 'buyQty':
          return (parseFloat(dataB.buyVolume) || 0) - (parseFloat(dataA.buyVolume) || 0);
        case 'sellQty':
          return (parseFloat(dataB.sellVolume) || 0) - (parseFloat(dataA.sellVolume) || 0);
        case 'bsRatio':
          return (parseFloat(dataB.bsRatio) || 0) - (parseFloat(dataA.bsRatio) || 0);
        default:
          return 0;
      }
    });

    return stocks;
  };

  // Format buy:sell ratio for display (e.g., "10:1" or "3:2")
  const formatBuySellRatio = (bsRatio) => {
    if (!bsRatio || bsRatio === 0) return '1:1';
    
    if (bsRatio >= 1) {
      // More buyers (e.g., 2.5 becomes "5:2")
      const buyPart = Math.round(bsRatio * 2);
      return `${buyPart}:2`;
    } else {
      // More sellers (e.g., 0.5 becomes "1:2")
      const sellPart = Math.round((1 / bsRatio) * 2);
      return `2:${sellPart}`;
    }
  };

  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
  };

  const formatPrice = (price) => `₹${price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formatVolume = (volume) => {
    if (volume >= 10000000) return `${(volume / 10000000).toFixed(1)}Cr`;
    if (volume >= 100000) return `${(volume / 100000).toFixed(1)}L`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume?.toString();
  };

  const getMarketTimingInfo = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const dayOfWeek = istTime.getDay();
    const currentTimeInMinutes = hours * 60 + minutes;
    
    const marketOpenTime = 9 * 60 + 15;
    const marketCloseTime = 15 * 60 + 30;
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    if (!isWeekday) return 'Weekend';
    
    if (currentTimeInMinutes < marketOpenTime) {
      const minutesUntilOpen = marketOpenTime - currentTimeInMinutes;
      const hoursUntilOpen = Math.floor(minutesUntilOpen / 60);
      const minsUntilOpen = minutesUntilOpen % 60;
      return `Opens in ${hoursUntilOpen}h ${minsUntilOpen}m`;
    } else if (currentTimeInMinutes > marketCloseTime) {
      return 'After Hours';
    } else {
      const minutesUntilClose = marketCloseTime - currentTimeInMinutes;
      const hoursUntilClose = Math.floor(minutesUntilClose / 60);
      const minsUntilClose = minutesUntilClose % 60;
      return `Closes in ${hoursUntilClose}h ${minsUntilClose}m`;
    }
  };

  return (
    <div className="professional-trading-dashboard">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading {selectedIndex} data...</p>
            {!stockService.isConnectedToBackend && (
              <p className="error-message">⚠️ Backend not connected. Please start server.</p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pro-header">
        <div className="header-section">
          {/* Index Selector Dropdown */}
          <div className="brand-section">
            <div className="index-selector-container">
              <button 
                className="index-selector-btn"
                onClick={() => setShowIndexDropdown(!showIndexDropdown)}
              >
                <BarChart3 size={24} className="brand-icon" />
                <div className="selector-text">
                  <span className="app-name">Petrostock</span>
                  <span className="selected-index">{selectedIndex}</span>
                </div>
                <ChevronDown size={20} className={`dropdown-icon ${showIndexDropdown ? 'open' : ''}`} />
              </button>
              
              {showIndexDropdown && (
                <div className="index-dropdown-menu">
                  {INDEX_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      className={`index-option ${selectedIndex === option.value ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedIndex(option.value);
                        setShowIndexDropdown(false);
                      }}
                    >
                      <span className="option-icon">{option.icon}</span>
                      <div className="option-text">
                        <span className="option-label">{option.label}</span>
                        <span className="option-count">
                          {NIFTY_INDICES[option.value]?.stocks.length} stocks
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="market-indicators">
            <div className="nifty-indicator">
              <span className="index-name">{niftyData.name}</span>
              <span className="index-value">
                {niftyData.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className={`index-change ${(niftyData.changePercent ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                {(niftyData.changePercent ?? 0) >= 0 ? '+' : ''}
                {(niftyData.change ?? 0).toFixed(2)} ({(niftyData.changePercent ?? 0).toFixed(2)}%)
              </span>
              {!stockService.isConnectedToBackend && (
                <span className="simulated-badge">DEMO</span>
              )}
              {stockService.isConnectedToBackend && (
                <span className="live-badge">LIVE</span>
              )}
            </div>
          </div>
        </div>

        <div className="search-section">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search stocks..."
              className="search-input-pro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          <div className="market-status">
            <div className={`status-dot ${isMarketOpen ? 'open' : 'closed'}`}></div>
            <div className="status-details">
              <span className="status-text">Market {isMarketOpen ? 'Open' : 'Closed'}</span>
              <span className="market-hours">{getMarketTimingInfo()}</span>
            </div>
          </div>
          <div className="current-time-display">
            {currentTime.toLocaleTimeString('en-IN')}
          </div>
          <button 
            className={`refresh-button ${isLoading ? 'loading' : ''}`}
            onClick={loadStockData}
            disabled={isLoading}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pro-main-content">
        {/* Left Panel - Watchlist */}
        <div className="pro-left-panel">
          <div className="panel-header-pro">
            <h3>Watchlist ({getFilteredAndSortedStocks().length} of {currentIndexStocks.length})</h3>
            <Filter size={16} className="filter-icon" />
          </div>
          
          <div className="watchlist-controls">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="price">Price ↓</option>
              <option value="change">Change % ↓</option>
              <option value="buyQty">Buy Qty ↓</option>
              <option value="sellQty">Sell Qty ↓</option>
              <option value="bsRatio">B/S Ratio ↓</option>
            </select>
            
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Stocks</option>
              <option value="gainers">Gainers 📈</option>
              <option value="losers">Losers 📉</option>
            </select>

            <select 
              value={ratioFilter} 
              onChange={(e) => setRatioFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Ratios</option>
              <option value="highBuy">High Buy 🟢</option>
              <option value="balanced">Balanced ⚪</option>
              <option value="highSell">High Sell 🔴</option>
            </select>

            <select 
              value={qtyFilter} 
              onChange={(e) => setQtyFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Qty</option>
              <option value="highBuyQty">High Buy Qty 🟢</option>
              <option value="highSellQty">High Sell Qty 🔴</option>
              <option value="balancedQty">Balanced Qty ⚪</option>
            </select>
          </div>

          <div className="watchlist-header">
            <span>Company</span>
            <span>Price (1D)</span>
            <span>Buy Qty</span>
            <span>Sell Qty</span>
            <span>Buy:Sell</span>
          </div>

          <div className="stock-list-pro">
            {getFilteredAndSortedStocks().length === 0 ? (
              <div className="no-stocks-message">
                <p>No stocks match the current filters.</p>
                <p className="hint">Try adjusting your filters or wait for data to load.</p>
              </div>
            ) : (
              getFilteredAndSortedStocks().map(symbol => {
              const stock = marketData[symbol];
              
              // Show loading state
              if (!stock) {
                return (
                  <div key={symbol} className="stock-item-pro loading">
                    <div className="stock-company-section">
                      <div className="company-logo pending">⏳</div>
                      <div className="company-info">
                        <span className="company-name">{symbol}</span>
                        <span className="company-symbol">Loading...</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Show pending/loading state (waiting for real data)
              if (stock.isPending || (!stock.isLiveData && stock.price === 0)) {
                return (
                  <div key={symbol} className="stock-item-pro pending-state">
                    <div className="stock-company-section">
                      <div className="company-logo pending">⏳</div>
                      <div className="company-info">
                        <span className="company-name">{stock.name || symbol}</span>
                        <span className="company-symbol pending-text">Fetching real data...</span>
                      </div>
                    </div>
                    <div className="stock-price-section">
                      <span className="stock-price pending-text">⏳ Loading</span>
                    </div>
                    <div className="stock-buy-qty">
                      <span className="qty-value pending-text">-</span>
                    </div>
                    <div className="stock-sell-qty">
                      <span className="qty-value pending-text">-</span>
                    </div>
                    <div className="stock-ratio-badge pending">
                      <span className="ratio-value">-:-</span>
                    </div>
                  </div>
                );
              }

              // Show error state
              if (stock.error) {
                return (
                  <div key={symbol} className="stock-item-pro error-state">
                    <div className="stock-company-section">
                      <div className="company-logo error">!</div>
                      <div className="company-info">
                        <span className="company-name">{stock.name || symbol}</span>
                        <span className="company-symbol error-text">{stock.message || 'Error'}</span>
                      </div>
                    </div>
                    <div className="stock-price-section">
                      <span className="stock-price error-text">No Data</span>
                    </div>
                    <div className="stock-buy-qty">
                      <span className="qty-value">-</span>
                    </div>
                    <div className="stock-sell-qty">
                      <span className="qty-value">-</span>
                    </div>
                    <div className="stock-ratio-badge error">
                      <span className="ratio-value">-:-</span>
                    </div>
                  </div>
                );
              }

              const buyRatio = formatBuySellRatio(stock.bsRatio);
              const isHighBuy = stock.bsRatio > 1.2;
              const isHighSell = stock.bsRatio < 0.8;

              return (
                <div 
                  key={symbol}
                  className={`stock-item-pro ${selectedStock === symbol ? 'selected' : ''}`}
                  onClick={() => setSelectedStock(symbol)}
                >
                  <div className="stock-company-section">
                    <div className="company-logo">
                      {(stock.name || symbol).charAt(0)}
                    </div>
                    <div className="company-info">
                      <span className="company-name">
                        {stock.name || symbol}
                        {stock.isLiveData && <span className="live-dot" title="Live Data">●</span>}
                      </span>
                      <span className="company-symbol">{symbol}</span>
                    </div>
                    <button 
                      className={`watchlist-btn ${watchlist.includes(symbol) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        watchlist.includes(symbol) 
                          ? removeFromWatchlist(symbol) 
                          : addToWatchlist(symbol);
                      }}
                    >
                      <Star size={12} />
                    </button>
                  </div>
                  
                  <div className="stock-price-section">
                    <span className="stock-price">{formatPrice(stock.price)}</span>
                    <span className={`stock-change ${(stock.changePercent ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(stock.changePercent ?? 0) >= 0 ? '+' : ''}{(stock.changePercent ?? 0).toFixed(2)}%
                    </span>
                  </div>

                  <div className="stock-buy-qty">
                    <span className="qty-value">{formatVolume(stock.buyVolume || 0)}</span>
                    <span className="qty-label">Buy</span>
                  </div>

                  <div className="stock-sell-qty">
                    <span className="qty-value">{formatVolume(stock.sellVolume || 0)}</span>
                    <span className="qty-label">Sell</span>
                  </div>
                  
                  <div className={`stock-ratio-badge ${isHighBuy ? 'high-buy' : isHighSell ? 'high-sell' : 'balanced'}`}>
                    <span className="ratio-label">Ratio</span>
                    <span className="ratio-value">{buyRatio}</span>
                    {isHighBuy && <span className="ratio-indicator">🟢</span>}
                    {isHighSell && <span className="ratio-indicator">🔴</span>}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Center Panel - Chart */}
        <div className="pro-center-panel">
          <div className="chart-header-pro">
            <div className="selected-stock-info">
              <h2 className="stock-title">{marketData[selectedStock]?.name || selectedStock}</h2>
              {marketData[selectedStock] ? (
                <div className="stock-details">
                  <span className="current-price">{formatPrice(marketData[selectedStock].price)}</span>
                  <span className={`price-change ${(marketData[selectedStock].changePercent ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                    {(marketData[selectedStock].changePercent ?? 0) >= 0 ? '+' : ''}
                    {formatPrice(marketData[selectedStock].change ?? 0)} 
                    ({(marketData[selectedStock].changePercent ?? 0).toFixed(2)}%)
                  </span>
                  {marketData[selectedStock].isLiveData && (
                    <span className="live-indicator">● LIVE</span>
                  )}
                </div>
              ) : (
                <div className="stock-details">
                  <span className="current-price">Loading...</span>
                </div>
              )}
            </div>
            
            <div className="chart-controls">
              <div className="timeframe-buttons">
                {['1D', '5D', '1M', '3M', '6M', '1Y'].map(tf => (
                  <button key={tf} className="timeframe-btn">{tf}</button>
                ))}
              </div>
              <button className="fullscreen-btn">
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          <div className="live-chart-section">
            <LiveChart 
              symbol={selectedStock} 
              data={marketData[selectedStock]} 
            />
          </div>

          {/* Stock Statistics with Buy/Sell Info */}
          <div className="stock-stats-grid">
            {marketData[selectedStock] && (
              <>
                <div className="stat-item">
                  <span className="stat-label">High</span>
                  <span className="stat-value">{formatPrice(marketData[selectedStock].high)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Low</span>
                  <span className="stat-value">{formatPrice(marketData[selectedStock].low)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Volume</span>
                  <span className="stat-value">{formatVolume(marketData[selectedStock].volume)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Buy Volume</span>
                  <span className="stat-value positive">{formatVolume(marketData[selectedStock].buyVolume)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Sell Volume</span>
                  <span className="stat-value negative">{formatVolume(marketData[selectedStock].sellVolume)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">B/S Ratio</span>
                  <span className={`stat-value ${marketData[selectedStock].bsRatio >= 1 ? 'positive' : 'negative'}`}>
                    {marketData[selectedStock].bsRatio}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">S/B Ratio</span>
                  <span className={`stat-value ${marketData[selectedStock].sbRatio < 1 ? 'positive' : 'negative'}`}>
                    {marketData[selectedStock].sbRatio}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Market Cap</span>
                  <span className="stat-value">{marketData[selectedStock].marketCap}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">P/E</span>
                  <span className="stat-value">{marketData[selectedStock].pe}</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfessionalTradingDashboard;
