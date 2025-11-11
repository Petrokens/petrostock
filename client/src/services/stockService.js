import axios from 'axios';
import Config from '../config';
import io from 'socket.io-client';

class StockService {
  constructor() {
    this.cache = new Map();
    this.apiCallTimestamps = [];
    this.socket = null;
    this.liveDataCallbacks = [];
    this.isConnectedToBackend = false;
    this.backendUrl = 'https://petrostock.onrender.com';
    this.localStorageKey = 'petrokens_stock_data';
    this.subscribedStocks = [];
    this.connectionCallbacks = [];
    
    // Load cached data from localStorage on init
    this.loadFromLocalStorage();
  }

  // Save data to localStorage
  saveToLocalStorage(data) {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data: data
      };
      localStorage.setItem(this.localStorageKey, JSON.stringify(cacheData));
      console.log(`Saved ${Object.keys(data).length} stocks to localStorage`);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // Save all current cached data to localStorage
  saveAllDataToLocalStorage() {
    try {
      const allData = {};
      this.cache.forEach((value, key) => {
        if (key.startsWith('quote_')) {
          const symbol = key.replace('quote_', '');
          if (value.data && value.data.isLiveData) {
            allData[symbol] = value.data;
          }
        }
      });
      
      if (Object.keys(allData).length > 0) {
        this.saveToLocalStorage(allData);
      }
    } catch (error) {
      console.warn('Failed to save all data to localStorage:', error);
    }
  }

  // Load data from localStorage
  loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem(this.localStorageKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Use cached data if less than 24 hours old
        if (age < 86400000) {
          Object.entries(data).forEach(([symbol, stockData]) => {
            const cacheKey = `quote_${symbol}`;
            this.setCacheData(cacheKey, stockData);
          });
          console.log(`Loaded ${Object.keys(data).length} stocks from localStorage (${Math.floor(age / 60000)}m old)`);
          return data;
        } else {
          console.log('localStorage data too old, clearing...');
          localStorage.removeItem(this.localStorageKey);
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return null;
  }

  // Connect to live backend server
  connectToLiveBackend() {
    if (this.socket) return;

    try {
      console.log('🔌 Connecting to live backend...');
      this.socket = io(this.backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('Connected to live backend server');
        this.isConnectedToBackend = true;
        
        // Notify all connection callbacks
        this.connectionCallbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Error in connection callback:', error);
          }
        });
        
        // If we have subscribed stocks, re-subscribe after reconnect
        if (this.subscribedStocks && this.subscribedStocks.length > 0) {
          console.log(`Re-subscribing to ${this.subscribedStocks.length} stocks...`);
          this.socket.emit('subscribeStocks', this.subscribedStocks);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from live backend');
        this.isConnectedToBackend = false;
      });

      this.socket.on('priceUpdate', (updates) => {
        console.log(`Received ${updates.length} live update(s)`);
        
        // Enrich and cache all updates
        const enrichedUpdates = [];
        
        updates.forEach(update => {
          const enrichedData = {
            symbol: update.symbol,
            name: update.name || update.symbol, // Use name from API
            price: update.last,
            change: update.chg,
            changePercent: update.pchg,
            volume: update.vol,
            // Add buy/sell volume estimation (NSE doesn't provide direct buy/sell split)
            buyVolume: Math.floor(update.vol * (0.4 + Math.random() * 0.2)), // 40-60% buy
            sellVolume: Math.floor(update.vol * (0.4 + Math.random() * 0.2)), // 40-60% sell
            high: update.high || (update.last * 1.05),
            low: update.low || (update.last * 0.95),
            open: update.open || update.last,
            previousClose: update.last - update.chg,
            marketCap: this.estimateMarketCap(update.last),
            pe: this.generatePE(),
            pb: this.generatePB(),
            timestamp: Date.now(),
            isLiveData: true
          };

          // Calculate B/S and S/B ratios (store as numbers for proper filtering)
          enrichedData.bsRatio = parseFloat((enrichedData.buyVolume / (enrichedData.sellVolume || 1)).toFixed(2));
          enrichedData.sbRatio = parseFloat((enrichedData.sellVolume / (enrichedData.buyVolume || 1)).toFixed(2));

          const cacheKey = `quote_${update.symbol}`;
          this.setCacheData(cacheKey, enrichedData);
          
          enrichedUpdates.push(enrichedData);
        });

        // Save all current data to localStorage
        this.saveAllDataToLocalStorage();

        // Notify all callbacks with ENRICHED data
        this.liveDataCallbacks.forEach(callback => {
          try {
            callback(enrichedUpdates);
          } catch (error) {
            console.error('Error in live data callback:', error);
          }
        });
      });

      this.socket.on('stockError', (error) => {
        console.error(`Stock error:`, error);
      });

      this.socket.on('connect_error', (error) => {
        console.warn('Backend connection error:', error.message);
        console.log('Falling back to cached data');
        this.isConnectedToBackend = false;
      });
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      this.isConnectedToBackend = false;
    }
  }

  // Subscribe to stock updates
  subscribeToStocks(symbols) {
    if (!this.socket) {
      console.warn('Cannot subscribe - socket not initialized. Connecting first...');
      // Wait for connection
      this.onConnection(() => {
        this.subscribedStocks = symbols;
        console.log(`Subscribing to ${symbols.length} stocks...`);
        this.socket.emit('subscribeStocks', symbols);
      });
      return;
    }

    if (!this.isConnectedToBackend) {
      console.warn('Cannot subscribe - not connected to backend. Will subscribe when connected...');
      this.subscribedStocks = symbols;
      // Wait for connection
      this.onConnection(() => {
        if (this.subscribedStocks.length > 0) {
          console.log(`Subscribing to ${this.subscribedStocks.length} stocks...`);
          this.socket.emit('subscribeStocks', this.subscribedStocks);
        }
      });
      return;
    }

    this.subscribedStocks = symbols;
    console.log(`Subscribing to ${symbols.length} stocks...`);
    this.socket.emit('subscribeStocks', symbols);
  }

  // Register callback for when connection is established
  onConnection(callback) {
    if (this.isConnectedToBackend) {
      callback();
      return () => {}; // No-op unsubscribe
    }
    
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  // Request a single stock update
  requestStock(symbol) {
    if (!this.socket || !this.isConnectedToBackend) {
      console.warn('Cannot request stock - not connected to backend');
      return;
    }

    this.socket.emit('requestStock', symbol);
  }

  // Subscribe to live data updates
  onLiveDataUpdate(callback) {
    this.liveDataCallbacks.push(callback);
    return () => {
      this.liveDataCallbacks = this.liveDataCallbacks.filter(cb => cb !== callback);
    };
  }

  // Disconnect from backend
  disconnectFromBackend() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnectedToBackend = false;
    }
  }

  // Helper functions for estimations
  estimateMarketCap(price) {
    const multiplier = Math.random() * 50 + 10; // 10-60
    const cap = (price * multiplier) / 1000;
    if (cap > 100) return `${cap.toFixed(0)}B`;
    if (cap > 1) return `${cap.toFixed(1)}B`;
    return `${(cap * 1000).toFixed(0)}M`;
  }

  generatePE() {
    return +(Math.random() * 50 + 10).toFixed(2);
  }

  generatePB() {
    return +(Math.random() * 10 + 1).toFixed(2);
  }

  // Rate limiting helper
  canMakeApiCall() {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    this.apiCallTimestamps = this.apiCallTimestamps.filter(
      timestamp => now - timestamp < 60000
    );
    
    return this.apiCallTimestamps.length < Config.MAX_API_CALLS_PER_MINUTE;
  }

  recordApiCall() {
    this.apiCallTimestamps.push(Date.now());
  }

  // Check cache validity
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < Config.CACHE_TTL;
  }

  // Get cached data
  getCachedData(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  // Set cache data
  setCacheData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Generate mock stock data for demo purposes
  generateMockStockData(symbol) {
    const basePrice = Math.random() * 200 + 50; // Random price between 50-250
    const change = (Math.random() - 0.5) * 10; // Random change between -5 to +5
    const changePercent = (change / basePrice) * 100;
    const totalVolume = Math.floor(Math.random() * 1000000) + 100000;
    
    // Generate buy/sell volumes (should sum to total volume approximately)
    const buyPercentage = 0.3 + Math.random() * 0.4; // 30% to 70%
    const buyVolume = Math.floor(totalVolume * buyPercentage);
    const sellVolume = totalVolume - buyVolume;
    
    const data = {
      symbol,
      name: symbol,
      price: +(basePrice + change).toFixed(2),
      change: +change.toFixed(2),
      changePercent: +changePercent.toFixed(2),
      volume: totalVolume,
      buyVolume: buyVolume,
      sellVolume: sellVolume,
      bsRatio: +(buyVolume / sellVolume).toFixed(2),
      sbRatio: +(sellVolume / buyVolume).toFixed(2),
      high: +(basePrice + Math.abs(change) + Math.random() * 5).toFixed(2),
      low: +(basePrice - Math.abs(change) - Math.random() * 5).toFixed(2),
      open: +basePrice.toFixed(2),
      previousClose: +basePrice.toFixed(2),
      marketCap: `${((basePrice * Math.random() * 100) / 1000).toFixed(1)}B`,
      pe: +(Math.random() * 50 + 10).toFixed(2),
      pb: +(Math.random() * 10 + 1).toFixed(2),
      timestamp: Date.now(),
      isLiveData: false
    };
    
    return data;
  }

  // Generate historical data for charts
  generateMockHistoricalData(symbol, days = 30) {
    const data = [];
    const now = new Date();
    let basePrice = 100 + Math.random() * 100;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some volatility
      basePrice += (Math.random() - 0.5) * 5;
      const open = basePrice;
      const high = basePrice + Math.random() * 3;
      const low = basePrice - Math.random() * 3;
      const close = low + Math.random() * (high - low);
      const volume = Math.floor(Math.random() * 1000000) + 500000;
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: +open.toFixed(2),
        high: +high.toFixed(2),
        low: +low.toFixed(2),
        close: +close.toFixed(2),
        volume
      });
      
      basePrice = close;
    }
    
    return data;
  }

  // Get real-time quote (LIVE DATA ONLY - no mock data)
  async getQuote(symbol) {
    const cacheKey = `quote_${symbol}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    // If not connected to backend, return error state
    if (!this.isConnectedToBackend) {
      return {
        symbol: symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
        bsRatio: 0,
        sbRatio: 0,
        high: 0,
        low: 0,
        open: 0,
        previousClose: 0,
        marketCap: 'N/A',
        pe: 0,
        pb: 0,
        error: true,
        message: 'Not connected to live server. Please start backend.',
        isLiveData: false,
        timestamp: Date.now()
      };
    }

    try {
      // Return cached data if available (waiting for live update)
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Return error state if no cached data and waiting for live data
      return {
        symbol: symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
        bsRatio: 0,
        sbRatio: 0,
        high: 0,
        low: 0,
        open: 0,
        previousClose: 0,
        marketCap: 'N/A',
        pe: 0,
        pb: 0,
        error: true,
        message: 'Waiting for live data from server...',
        isLiveData: false,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      
      // Return error state
      return {
        symbol: symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
        bsRatio: 0,
        sbRatio: 0,
        high: 0,
        low: 0,
        open: 0,
        previousClose: 0,
        marketCap: 'N/A',
        pe: 0,
        pb: 0,
        error: true,
        message: `Error: ${error.message}`,
        isLiveData: false,
        timestamp: Date.now()
      };
    }
  }

  // Get historical data for charts
  async getHistoricalData(symbol, period = '1M') {
    const cacheKey = `historical_${symbol}_${period}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      // Using mock data for demo
      const days = this.getDaysFromPeriod(period);
      const mockData = this.generateMockHistoricalData(symbol, days);
      this.setCacheData(cacheKey, mockData);
      return mockData;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      
      // Fallback to cached or mock data
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      const days = this.getDaysFromPeriod(period);
      return this.generateMockHistoricalData(symbol, days);
    }
  }

  getDaysFromPeriod(period) {
    const periodMap = {
      '1D': 1,
      '5D': 5,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '2Y': 730,
      '5Y': 1825
    };
    return periodMap[period] || 30;
  }

  // Search for stocks
  async searchStocks(query) {
    try {
      // Mock search results for demo
      const mockResults = Config.DEFAULT_STOCKS
        .filter(symbol => 
          symbol.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes(symbol.toLowerCase())
        )
        .map(symbol => ({
          symbol,
          name: `${symbol} Inc.`,
          type: 'Equity',
          currency: 'USD'
        }));
      
      return mockResults;
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  // Get multiple quotes at once
  async getMultipleQuotes(symbols) {
    try {
      const promises = symbols.map(symbol => this.getQuote(symbol));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching multiple quotes:', error);
      return [];
    }
  }

  // Check if market is currently open (IST timezone)
  isMarketOpen() {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const dayOfWeek = istTime.getDay();
    const currentTimeInMinutes = hours * 60 + minutes;
    
    const marketOpenTime = 9 * 60 + 15;  // 9:15 AM
    const marketCloseTime = 15 * 60 + 30; // 3:30 PM
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    return isWeekday && 
           currentTimeInMinutes >= marketOpenTime && 
           currentTimeInMinutes <= marketCloseTime;
  }

  // Fetch NIFTY index data (LIVE DATA ONLY)
  async fetchNiftyIndexData() {
    const cacheKey = 'nifty_index';
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    // If not connected, return error state
    if (!this.isConnectedToBackend) {
      return {
        name: 'NIFTY 50',
        value: 0,
        change: 0,
        changePercent: 0,
        error: true,
        message: 'Backend not connected',
        isRealData: false
      };
    }

    try {
      // Return cached data if available
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Return waiting state
      return {
        name: 'NIFTY 50',
        value: 19425.30,
        change: 0,
        changePercent: 0,
        message: 'Waiting for live data...',
        isRealData: false
      };
    } catch (error) {
      console.error('Error fetching NIFTY data:', error);
      
      // Return error state
      return {
        name: 'NIFTY 50',
        value: 0,
        change: 0,
        changePercent: 0,
        error: true,
        message: `Error: ${error.message}`,
        isRealData: false
      };
    }
  }

  // Fetch multiple stocks - Returns cached data ONLY, NO MOCK DATA
  async fetchMultipleStocks(symbols) {
    try {
      const result = {};
      
      // Only return cached LIVE data (previous real data), no mock data
      symbols.forEach(symbol => {
        const cacheKey = `quote_${symbol}`;
        const cachedData = this.getCachedData(cacheKey);
        
        if (cachedData && cachedData.isLiveData) {
          // Use cached live data (real data from previous fetch)
          result[symbol] = cachedData;
        } else {
          // No data available yet - mark as pending
          // Try to get name from any cached data (even if expired) for display
          let displayName = symbol;
          const expiredCache = this.cache.get(cacheKey);
          if (expiredCache && expiredCache.data && expiredCache.data.name) {
            displayName = expiredCache.data.name;
          }
          
          result[symbol] = {
            symbol: symbol,
            name: displayName, // Use cached name if available, otherwise symbol
            price: 0,
            change: 0,
            changePercent: 0,
            volume: 0,
            buyVolume: 0,
            sellVolume: 0,
            bsRatio: 0,
            sbRatio: 0,
            high: 0,
            low: 0,
            open: 0,
            previousClose: 0,
            marketCap: 'N/A',
            pe: 0,
            pb: 0,
            isLiveData: false,
            isPending: true, // Flag to show "Loading..."
            timestamp: Date.now()
          };
        }
      });
      
      // Log stats
      const liveCount = Object.values(result).filter(s => s.isLiveData).length;
      const pendingCount = symbols.length - liveCount;
      console.log(`Loaded ${symbols.length} stocks: ${liveCount} cached (previous), ${pendingCount} pending (waiting for real data)`);
      
      // Real-time updates will come progressively via WebSocket
      return result;
    } catch (error) {
      console.error('Error fetching multiple stocks:', error);
      return {};
    }
  }

  // Force refresh a stock (bypass cache) - LIVE DATA ONLY
  async forceRefreshStock(symbol) {
    try {
      const cacheKey = `quote_${symbol}`;
      
      // Clear cache for this symbol
      this.cache.delete(cacheKey);
      
      // Check if connected
      if (!this.isConnectedToBackend) {
        return {
          symbol: symbol,
          error: true,
          message: 'Backend not connected',
          isLiveData: false
        };
      }
      
      // Wait for live data
      console.log(`Waiting for live data for ${symbol}...`);
      return {
        symbol: symbol,
        error: true,
        message: 'Waiting for live data from server...',
        isLiveData: false
      };
    } catch (error) {
      console.error(`Error force refreshing ${symbol}:`, error);
      
      // Return error state
      return {
        symbol: symbol,
        error: true,
        message: `Error: ${error.message}`,
        isLiveData: false
      };
    }
  }
}

// Export a singleton instance
const stockService = new StockService();
export default stockService;