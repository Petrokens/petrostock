import { useState, useEffect } from 'react';
import { Plus, Search, X, Star, TrendingUp } from 'lucide-react';
import StockQuote from './StockQuote';
import stockService from '../services/stockService';
import Config from '../config';

const Watchlist = ({ onSelectStock }) => {
  const [watchedStocks, setWatchedStocks] = useState(Config.DEFAULT_STOCKS);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState({});
  const [showAddStock, setShowAddStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load initial stock data
  useEffect(() => {
    const loadWatchlistData = async () => {
      const loadingState = {};
      watchedStocks.forEach(symbol => {
        loadingState[symbol] = true;
      });
      setLoading(loadingState);

      try {
        const quotes = await stockService.getMultipleQuotes(watchedStocks);
        const dataMap = {};
        quotes.forEach((quote, index) => {
          if (quote) {
            dataMap[watchedStocks[index]] = quote;
          }
        });
        
        setStockData(dataMap);
      } catch (error) {
        console.error('Error loading watchlist data:', error);
      } finally {
        setLoading({});
      }
    };

    if (watchedStocks.length > 0) {
      loadWatchlistData();
    }
  }, [watchedStocks]);

  // Search for stocks
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const results = await stockService.searchStocks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add stock to watchlist
  const addToWatchlist = (symbol) => {
    if (!watchedStocks.includes(symbol)) {
      setWatchedStocks(prev => [...prev, symbol]);
      setShowAddStock(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Remove stock from watchlist
  const removeFromWatchlist = (symbol) => {
    setWatchedStocks(prev => prev.filter(s => s !== symbol));
    setStockData(prev => {
      const newData = { ...prev };
      delete newData[symbol];
      return newData;
    });
  };

  // Sort stocks by change percentage
  const getSortedStocks = () => {
    return [...watchedStocks].sort((a, b) => {
      const dataA = stockData[a];
      const dataB = stockData[b];
      
      if (!dataA && !dataB) return 0;
      if (!dataA) return 1;
      if (!dataB) return -1;
      
      return (dataB.changePercent || 0) - (dataA.changePercent || 0);
    });
  };

  return (
    <div className="watchlist">
      <div className="watchlist-header">
        <div className="header-title">
          <Star size={20} />
          <h2>My Watchlist</h2>
        </div>
        <button 
          className="add-stock-btn"
          onClick={() => setShowAddStock(!showAddStock)}
        >
          <Plus size={18} />
          Add Stock
        </button>
      </div>

      {/* Add Stock Section */}
      {showAddStock && (
        <div className="add-stock-section">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search for stocks (e.g., AAPL, TSLA)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
              autoFocus
            />
            <button
              className="close-search-btn"
              onClick={() => {
                setShowAddStock(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="search-results">
              {isSearching ? (
                <div className="searching">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="results-list">
                  {searchResults.map(result => (
                    <div
                      key={result.symbol}
                      className="search-result-item"
                      onClick={() => addToWatchlist(result.symbol)}
                    >
                      <div className="result-symbol">{result.symbol}</div>
                      <div className="result-name">{result.name}</div>
                      {watchedStocks.includes(result.symbol) && (
                        <div className="already-added">Added</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  No results found. Try searching for popular stocks like AAPL, TSLA, GOOGL.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Items */}
      <div className="watchlist-items">
        {getSortedStocks().map(symbol => (
          <div 
            key={symbol} 
            className="watchlist-item"
            onClick={() => onSelectStock(symbol)}
          >
            <div className="item-content">
              <StockQuote
                symbol={symbol}
                data={stockData[symbol]}
                isLoading={loading[symbol]}
              />
            </div>
            <div className="item-actions">
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWatchlist(symbol);
                }}
                title="Remove from watchlist"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {watchedStocks.length === 0 && (
        <div className="empty-watchlist">
          <TrendingUp size={48} className="empty-icon" />
          <h3>Your watchlist is empty</h3>
          <p>Add some stocks to track their performance</p>
          <button 
            className="add-first-stock-btn"
            onClick={() => setShowAddStock(true)}
          >
            <Plus size={18} />
            Add Your First Stock
          </button>
        </div>
      )}
    </div>
  );
};

export default Watchlist;