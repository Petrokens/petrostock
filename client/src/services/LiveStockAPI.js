// Live Stock API Service - Using Groww API
// This service fetches real-time stock data from Groww API
import axios from 'axios';
import Config from '../config.js';

class LiveStockAPI {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = Config.CACHE_TTL;
    this.apiCallCount = 0;
    this.lastReset = Date.now();
    this.maxRequestsPerMinute = Config.MAX_API_CALLS_PER_MINUTE;
    
    // Groww API configuration from config
    this.baseURL = Config.GROWW_BASE_URL;
    this.stockDataURL = Config.GROWW_STOCK_DATA_URL;
    this.indexSearchURL = Config.GROWW_INDEX_SEARCH_URL;
    this.headers = Config.getAuthHeaders(); // Use authenticated headers
    
    // Configure axios instance with authentication
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: this.headers
    });
    
    // Log authentication status
    this.logAuthStatus();
  }

  // Log authentication status
  logAuthStatus() {
    const hasApiKey = !!Config.GROWW_API_KEY;
    const hasScriptKey = !!Config.GROWW_SCRIPT_KEY;
    const hasAccessToken = !!Config.GROWW_ACCESS_TOKEN;
    const hasClientId = !!Config.GROWW_CLIENT_ID;
    const hasSessionToken = !!Config.GROWW_SESSION_TOKEN;
    const useFallback = Config.USE_FALLBACK_DATA;
    
    console.log('🔐 Groww API Authentication Status:');
    console.log(`   API Key: ${hasApiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Script Key: ${hasScriptKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Access Token: ${hasAccessToken ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Client ID: ${hasClientId ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Session Token: ${hasSessionToken ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Fallback Data: ${useFallback ? '🟡 Enabled' : '🔴 Disabled (Real API only)'}`);
    
    if (hasApiKey && hasScriptKey) {
      console.log('✅ Authentication configured! Using real Groww API endpoints.');
    } else if (!hasApiKey && !hasAccessToken && !hasScriptKey) {
      console.warn('⚠️ No authentication configured. API calls may fail.');
      console.warn('   Add your Groww API keys to .env file.');
    }
  }

  // Rate limiting for API calls
  checkRateLimit() {
    const now = Date.now();
    
    // Reset counter every minute using config
    if (now - this.lastReset > Config.RATE_LIMIT_WINDOW) {
      this.apiCallCount = 0;
      this.lastReset = now;
    }
    
    if (this.apiCallCount >= this.maxRequestsPerMinute) {
      console.warn('⚠️ Rate limit reached. Please wait before making more requests.');
      return false;
    }
    
    this.apiCallCount++;
    return true;
  }

  // Cache management
  isCacheValid(symbol) {
    const cached = this.cache.get(symbol);
    return cached && (Date.now() - cached.timestamp) < this.cacheExpiry;
  }

  getCachedData(symbol) {
    const cached = this.cache.get(symbol);
    return cached ? cached.data : null;
  }

  setCacheData(symbol, data) {
    this.cache.set(symbol, {
      data: { ...data, lastFetched: new Date().toISOString() },
      timestamp: Date.now()
    });
  }

  // Main method to fetch real stock data from Groww API
  async fetchStockData(symbol) {
    try {
      // Check cache first
      if (this.isCacheValid(symbol)) {
        console.log(`📱 Using cached data for ${symbol}`);
        return this.getCachedData(symbol);
      }

      // Check rate limit
      if (!this.checkRateLimit()) {
        const cachedData = this.getCachedData(symbol);
        if (cachedData) {
          console.log(`� Rate limited - using cached data for ${symbol}`);
          return cachedData;
        }
        throw new Error('Rate limit exceeded and no cached data available');
      }

      console.log(`🔍 Fetching real data from Groww API for ${symbol}...`);

      // Groww API endpoint for live stock prices
      const apiUrl = `https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/NSE/segment/CASH/${symbol}`;
      
      const response = await this.axiosInstance.get(apiUrl);
      
      if (response.data && response.data.ltp) {
        const processedData = this.processGrowwStockData(symbol, response.data);
        this.setCacheData(symbol, processedData);
        console.log(`✅ Fetched real data for ${symbol}: ₹${response.data.ltp}`);
        return processedData;
      } else {
        throw new Error(`❌ Invalid response format from Groww API for ${symbol}`);
      }

    } catch (error) {
      console.error(`❌ Error fetching data for ${symbol}:`, error.message);
      
      // Return cached data if available
      const cachedData = this.getCachedData(symbol);
      if (cachedData) {
        console.log(`📦 Using cached data for ${symbol} due to API error`);
        return cachedData;
      }
      
      // Only use fallback if explicitly enabled in config
      if (Config.USE_FALLBACK_DATA) {
        console.log(`🎲 Falling back to dummy data for ${symbol}`);
        return this.generateFallbackData(symbol);
      } else {
        throw new Error(`❌ Failed to fetch real data for ${symbol}: ${error.message}`);
      }
    }
  }



  // Process Groww API response data
  processGrowwStockData(symbol, apiData) {
    return {
      symbol,
      price: parseFloat(apiData.ltp || 0),
      change: parseFloat(apiData.dayChange || 0),
      changePercent: parseFloat(apiData.dayChangePerc || 0),
      high: parseFloat(apiData.high || apiData.ltp || 0),
      low: parseFloat(apiData.low || apiData.ltp || 0),
      open: parseFloat(apiData.open || apiData.ltp || 0),
      previousClose: parseFloat(apiData.close || apiData.ltp || 0),
      volume: parseInt(apiData.volume || 0),
      lastUpdate: new Date(),
      isRealData: true,
      source: 'Groww API'
    };
  }

  // Generate fallback dummy data when API fails
  generateFallbackData(symbol) {
    const basePrices = {
      'RELIANCE': 2450.75, 'TCS': 3890.50, 'HDFCBANK': 1687.25, 'INFY': 1456.80,
      'ICICIBANK': 956.45, 'KOTAKBANK': 1789.60, 'SBIN': 542.30, 'BHARTIARTL': 1234.90,
      'ITC': 467.85, 'LT': 3456.20, 'AXISBANK': 1098.75, 'ASIANPAINT': 2987.40,
      'MARUTI': 10875.60, 'M&M': 2687.35, 'NETWORK18': 78.45, 'SUNPHARMA': 1245.80,
      'TITAN': 3421.90, 'WIPRO': 567.25, 'NESTLEIND': 2345.70, 'HINDUNILVR': 2456.85
    };
    
    const basePrice = basePrices[symbol] || 1000 + Math.random() * 2000;
    const variation = (Math.random() - 0.5) * 0.05;
    const currentPrice = basePrice * (1 + variation);
    const previousClose = basePrice * (1 + (Math.random() - 0.5) * 0.03);
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    console.log(`🎲 Generated fallback data for ${symbol}: ₹${currentPrice.toFixed(2)}`);
    
    return {
      symbol,
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      high: parseFloat((Math.max(currentPrice, previousClose) * 1.02).toFixed(2)),
      low: parseFloat((Math.min(currentPrice, previousClose) * 0.98).toFixed(2)),
      open: parseFloat((previousClose * 1.01).toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      volume: Math.floor(100000 + Math.random() * 500000),
      lastUpdate: new Date(),
      isRealData: false,
      source: 'Fallback Data'
    };
  }





  // Fetch real NIFTY Index Data from Groww API
  async fetchNiftyIndexData() {
    try {
      console.log('📊 Fetching real NIFTY Index data from Groww API...');
      
      // Check rate limit
      if (!this.checkRateLimit()) {
        console.log('📦 Rate limited - using fallback NIFTY data');
        return this.generateFallbackNiftyData();
      }
      
      // Groww API endpoint for NIFTY 50 index data
      const apiUrl = `https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/NSE/segment/INDICES/NIFTY%2050`;
      
      const response = await this.axiosInstance.get(apiUrl);
      
      if (response.data && response.data.content && response.data.content.length > 0) {
        const niftyData = response.data.content[0];
        
        const processedData = {
          name: 'NIFTY 50',
          value: parseFloat(niftyData.ltp || 19500),
          change: parseFloat(niftyData.dayChange || 0),
          changePercent: parseFloat(niftyData.dayChangePerc || 0),
          high: parseFloat(niftyData.high || niftyData.ltp || 19500),
          low: parseFloat(niftyData.low || niftyData.ltp || 19500),
          lastUpdate: new Date(),
          isRealData: true
        };
        
        console.log(`✅ Fetched real NIFTY data: ${processedData.value}`);
        return processedData;
      } else {
        throw new Error('Invalid NIFTY response format');
      }
    } catch (error) {
      console.warn('Failed to fetch NIFTY data from API:', error.message);
      
      // Only use fallback if explicitly enabled
      if (Config.USE_FALLBACK_DATA) {
        console.log('🎲 Using fallback NIFTY data');
        return this.generateFallbackNiftyData();
      } else {
        throw new Error(`❌ Failed to fetch real NIFTY data: ${error.message}`);
      }
    }
  }

  // Generate fallback NIFTY data
  generateFallbackNiftyData() {
    const baseValue = 19500 + (Math.random() - 0.5) * 1000;
    const previousClose = baseValue * (1 + (Math.random() - 0.5) * 0.02);
    const currentValue = baseValue * (1 + (Math.random() - 0.5) * 0.015);
    const change = currentValue - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      name: 'NIFTY 50',
      value: parseFloat(currentValue.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      high: parseFloat((Math.max(currentValue, previousClose) * 1.01).toFixed(2)),
      low: parseFloat((Math.min(currentValue, previousClose) * 0.99).toFixed(2)),
      lastUpdate: new Date(),
      isRealData: false
    };
  }



  // Convert symbol formats for NSE
  convertToNSE(symbol) {
    const nseMap = {
      'RELIANCE': 'RELIANCE.NS',
      'TCS': 'TCS.NS', 
      'HDFCBANK': 'HDFCBANK.NS',
      'INFY': 'INFY.NS',
      'ICICIBANK': 'ICICIBANK.NS',
      'KOTAKBANK': 'KOTAKBANK.NS',
      'SBIN': 'SBIN.NS',
      'BHARTIARTL': 'BHARTIARTL.NS',
      'ITC': 'ITC.NS',
      'LT': 'LT.NS',
      'AXISBANK': 'AXISBANK.NS',
      'ASIANPAINT': 'ASIANPAINT.NS',
      'MARUTI': 'MARUTI.NS',
      'M&M': 'M&M.NS',
      'NETWORK18': 'NETWORK18.NS',
      'SUNPHARMA': 'SUNPHARMA.NS',
      'TITAN': 'TITAN.NS'
    };
    
    return nseMap[symbol] || `${symbol}.NS`;
  }

  convertToYahoo(symbol) {
    return this.convertToNSE(symbol); // Same format for Yahoo
  }







  // Check if Indian market is open using config timing
  isMarketOpen() {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: Config.MARKET_TIMEZONE}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const dayOfWeek = istTime.getDay();
    const currentTimeInMinutes = hours * 60 + minutes;
    
    // Market hours: Monday (1) to Friday (5)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    // Parse market timing from config
    const [openHour, openMin] = Config.MARKET_OPEN_TIME.split(':').map(Number);
    const [closeHour, closeMin] = Config.MARKET_CLOSE_TIME.split(':').map(Number);
    
    const marketOpenTime = openHour * 60 + openMin;  // 9:15 AM = 555 minutes
    const marketCloseTime = closeHour * 60 + closeMin; // 3:30 PM = 930 minutes
    
    const isWithinTradingHours = currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes <= marketCloseTime;
    
    console.log(`🕒 ${Config.MARKET_TIMEZONE} Time: ${hours}:${minutes.toString().padStart(2, '0')}, Day: ${dayOfWeek}, Market Open: ${isWeekday && isWithinTradingHours}`);
    
    return isWeekday && isWithinTradingHours;
  }

  // Hash function for consistent data
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  // Fetch real NIFTY indices data from Groww API
  async fetchNiftyIndex(indexName = 'NIFTY200') {
    try {
      console.log(`🔍 Fetching real ${indexName} index data from Groww API...`);
      
      // Check cache for index
      const cacheKey = `INDEX_${indexName}`;
      if (this.isCacheValid(cacheKey)) {
        return this.getCachedData(cacheKey);
      }

      // Check rate limit
      if (!this.checkRateLimit()) {
        const cachedData = this.getCachedData(cacheKey);
        if (cachedData) {
          console.log(`📦 Rate limited - using cached data for ${indexName}`);
          return cachedData;
        }
        return this.generateFallbackIndexData(indexName);
      }

      // Map index names to Groww API format
      const indexMapping = {
        'NIFTY50': 'NIFTY%2050',
        'NIFTY200': 'NIFTY%20200', 
        'NIFTY100': 'NIFTY%20100',
        'NIFTY': 'NIFTY%2050'
      };

      const apiIndexName = indexMapping[indexName] || 'NIFTY%2050';
      const apiUrl = `https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/NSE/segment/INDICES/${apiIndexName}`;
      
      const response = await this.axiosInstance.get(apiUrl);
      
      if (response.data && response.data.content && response.data.content.length > 0) {
        const indexData = response.data.content[0];
        
        const processedData = {
          name: indexName,
          value: parseFloat(indexData.ltp || 15000),
          change: parseFloat(indexData.dayChange || 0),
          changePercent: parseFloat(indexData.dayChangePerc || 0),
          high: parseFloat(indexData.high || indexData.ltp || 15000),
          low: parseFloat(indexData.low || indexData.ltp || 15000),
          lastUpdate: new Date(),
          isRealData: true
        };
        
        this.setCacheData(cacheKey, processedData);
        console.log(`✅ Fetched real ${indexName} data: ${processedData.value}`);
        return processedData;
      } else {
        throw new Error(`Invalid ${indexName} response format`);
      }

    } catch (error) {
      console.error(`❌ Error fetching ${indexName}:`, error.message);
      
      // Only use fallback if explicitly enabled
      if (Config.USE_FALLBACK_DATA) {
        return this.generateFallbackIndexData(indexName);
      } else {
        throw new Error(`❌ Failed to fetch real ${indexName} data: ${error.message}`);
      }
    }
  }

  // Generate fallback index data
  generateFallbackIndexData(indexName) {
    console.log(`🎲 Generating fallback data for ${indexName}`);
    
    const indexBaseValues = {
      'NIFTY50': 19500, 'NIFTY200': 10500, 'NIFTY100': 19200, 'NIFTY': 19500
    };

    const baseValue = indexBaseValues[indexName] || 15000;
    const variation = (Math.random() - 0.5) * 0.02;
    const currentValue = baseValue * (1 + variation);
    const previousClose = baseValue * (1 + (Math.random() - 0.5) * 0.015);
    const change = currentValue - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      name: indexName,
      value: parseFloat(currentValue.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      high: parseFloat((Math.max(currentValue, previousClose) * 1.008).toFixed(2)),
      low: parseFloat((Math.min(currentValue, previousClose) * 0.992).toFixed(2)),
      lastUpdate: new Date(),
      isRealData: false
    };
  }



  // Force refresh a stock (clear cache and fetch fresh data)
  async forceRefreshStock(symbol) {
    console.log(`🔄 Force refreshing ${symbol}...`);
    this.cache.delete(symbol); // Clear cache
    return await this.fetchStockData(symbol);
  }

  // Fetch multiple stocks efficiently with dummy data
  async fetchMultipleStocks(symbols) {
    const data = {};
    const batchSize = 5; // Can handle more since it's dummy data
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const promises = batch.map(symbol => 
        this.fetchStockData(symbol).catch(error => {
          console.warn(`❌ Error generating ${symbol}:`, error.message);
          return { 
            symbol, 
            error: true, 
            message: `No dummy data available for ${symbol}`,
            lastUpdate: new Date()
          };
        })
      );
      
      try {
        const results = await Promise.all(promises);
        batch.forEach((symbol, index) => {
          data[symbol] = results[index];
        });
        
        // Brief pause between batches (shorter since it's dummy data)
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Batch error:`, error);
        batch.forEach(symbol => {
          data[symbol] = { 
            symbol, 
            error: true, 
            message: `Batch generation failed for ${symbol}`,
            lastUpdate: new Date()
          };
        });
      }
    }
    
    return data;
  }
}

export default LiveStockAPI;