import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Filter, Search, RefreshCw, BarChart3 } from 'lucide-react';
import IndianStockCard from './IndianStockCard';
import StockDetailsModal from './StockDetailsModal';
import LiveClock from './LiveClock';
import indianStockService from '../services/indianStockService';
import Config from '../config';

const Nifty200Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('buyRatio'); // buyRatio, changePercent, volume, price
  const [filterSector, setFilterSector] = useState('all');
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    startLiveUpdates();
  }, []);

  // Filter and sort stocks when dependencies change
  useEffect(() => {
    filterAndSortStocks();
  }, [stocks, searchQuery, sortBy, filterSector]);

  const loadDashboardData = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    
    try {
      // Load top stocks by buy/sell ratio
      const [topByRatio, gainers, losers] = await Promise.all([
        indianStockService.getTopStocksByBuySellRatio(30),
        indianStockService.getTopGainers(5),
        indianStockService.getTopLosers(5)
      ]);
      
      setStocks(topByRatio);
      setTopGainers(gainers);
      setTopLosers(losers);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, []);

  const startLiveUpdates = () => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, Config.REAL_TIME_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  };

  const filterAndSortStocks = () => {
    let filtered = [...stocks];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(stock =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sector filter
    if (filterSector !== 'all') {
      filtered = filtered.filter(stock => stock.sector === filterSector);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'buyRatio':
          return b.buyRatio - a.buyRatio;
        case 'changePercent':
          return b.changePercent - a.changePercent;
        case 'volume':
          return b.volume - a.volume;
        case 'price':
          return b.price - a.price;
        case 'marketCap':
          return parseFloat(b.marketCap.replace(',', '')) - parseFloat(a.marketCap.replace(',', ''));
        default:
          return 0;
      }
    });

    setFilteredStocks(filtered);
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStock(null);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const getSectors = () => {
    const sectors = [...new Set(stocks.map(stock => stock.sector))];
    return sectors.sort();
  };

  const getMarketSummary = () => {
    const totalStocks = stocks.length;
    const gainers = stocks.filter(stock => stock.changePercent > 0).length;
    const losers = stocks.filter(stock => stock.changePercent < 0).length;
    const avgBuyRatio = totalStocks > 0 ? 
      (stocks.reduce((sum, stock) => sum + stock.buyRatio, 0) / totalStocks).toFixed(1) : 0;
    
    return { totalStocks, gainers, losers, avgBuyRatio };
  };

  const marketSummary = getMarketSummary();

  return (
    <div className="nifty-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">
            <BarChart3 size={32} />
            Nifty 200 Stock Tracker
          </h1>
          <div className="market-status">
            <span className="nifty-badge">NIFTY 200</span>
            <span className="live-indicator">● Live</span>
          </div>
        </div>
        
        <div className="header-center">
          <LiveClock timezone="Asia/Kolkata" label="IST Market Time" />
        </div>
        
        <div className="header-right">
          <button 
            className="refresh-dashboard-btn"
            onClick={handleRefresh}
            disabled={loading.dashboard}
          >
            <RefreshCw size={18} className={loading.dashboard ? 'spinning' : ''} />
            Refresh
          </button>
          {lastUpdate && (
            <div className="last-update">
              Last: {lastUpdate.toLocaleTimeString('en-IN')}
            </div>
          )}
        </div>
      </header>

      {/* Market Summary */}
      <div className="market-summary-dashboard">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon total">
              <BarChart3 size={24} />
            </div>
            <div className="card-content">
              <div className="card-value">{marketSummary.totalStocks}</div>
              <div className="card-label">Total Stocks</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon gainers">
              <TrendingUp size={24} />
            </div>
            <div className="card-content">
              <div className="card-value">{marketSummary.gainers}</div>
              <div className="card-label">Gainers</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon losers">
              <TrendingDown size={24} />
            </div>
            <div className="card-content">
              <div className="card-value">{marketSummary.losers}</div>
              <div className="card-label">Losers</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon ratio">
              <div className="ratio-icon">{marketSummary.avgBuyRatio}%</div>
            </div>
            <div className="card-content">
              <div className="card-value">Buy Ratio</div>
              <div className="card-label">Average</div>
            </div>
          </div>
        </div>

        {/* Top Movers */}
        <div className="top-movers">
          <div className="movers-section">
            <h3 className="movers-title">
              <TrendingUp size={18} className="text-green" />
              Top Gainers
            </h3>
            <div className="movers-list">
              {topGainers.map(stock => (
                <div key={stock.symbol} className="mover-item gainer">
                  <span className="mover-symbol">{stock.symbol}</span>
                  <span className="mover-change">+{stock.changePercent.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="movers-section">
            <h3 className="movers-title">
              <TrendingDown size={18} className="text-red" />
              Top Losers
            </h3>
            <div className="movers-list">
              {topLosers.map(stock => (
                <div key={stock.symbol} className="mover-item loser">
                  <span className="mover-symbol">{stock.symbol}</span>
                  <span className="mover-change">{stock.changePercent.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="dashboard-controls">
        <div className="search-section">
          <div className="search-input-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-dashboard"
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>
              <Filter size={16} />
              Sort by:
            </label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="buyRatio">Buy Ratio</option>
              <option value="changePercent">Change %</option>
              <option value="volume">Volume</option>
              <option value="price">Price</option>
              <option value="marketCap">Market Cap</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sector:</label>
            <select 
              value={filterSector} 
              onChange={(e) => setFilterSector(e.target.value)}
              className="sector-select"
            >
              <option value="all">All Sectors</option>
              {getSectors().map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Grid */}
      <div className="stocks-grid">
        {loading.dashboard ? (
          // Loading skeleton
          Array.from({ length: 12 }).map((_, index) => (
            <IndianStockCard key={index} isLoading={true} />
          ))
        ) : filteredStocks.length > 0 ? (
          filteredStocks.map(stock => (
            <IndianStockCard
              key={stock.symbol}
              stockData={stock}
              onClick={handleStockClick}
            />
          ))
        ) : (
          <div className="no-stocks-message">
            <p>No stocks found matching your criteria.</p>
            <button onClick={() => {
              setSearchQuery('');
              setFilterSector('all');
            }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Stock Details Modal */}
      <StockDetailsModal
        stock={selectedStock}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Nifty200Dashboard;