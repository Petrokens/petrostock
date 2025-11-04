import axios from 'axios';
import Config from '../config';

// Nifty 200 stocks data (sample of major companies)
const NIFTY_200_STOCKS = [
  // Top 20 by market cap
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Oil & Gas', marketCap: '17,50,000' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT Services', marketCap: '12,80,000' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', marketCap: '8,90,000' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', marketCap: '7,20,000' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', marketCap: '5,80,000' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT Services', marketCap: '7,10,000' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', marketCap: '5,20,000' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', marketCap: '4,80,000' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', marketCap: '7,50,000' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking', marketCap: '3,60,000' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Construction', marketCap: '4,20,000' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT Services', marketCap: '4,50,000' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Paints', marketCap: '3,20,000' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobile', marketCap: '3,80,000' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking', marketCap: '3,40,000' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer Goods', marketCap: '3,10,000' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', sector: 'Pharma', marketCap: '2,80,000' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement', marketCap: '2,90,000' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'NBFC', marketCap: '4,60,000' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG', marketCap: '2,30,000' },
  
  // Additional popular stocks
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT Services', marketCap: '2,80,000' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT Services', marketCap: '1,40,000' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', sector: 'Power', marketCap: '2,10,000' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power', marketCap: '1,90,000' },
  { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation Ltd', sector: 'Oil & Gas', marketCap: '2,20,000' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', marketCap: '2,50,000' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Steel', marketCap: '1,50,000' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Steel', marketCap: '2,00,000' },
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma', marketCap: '1,10,000' },
  { symbol: 'DRREDDY', name: 'Dr. Reddys Laboratories Ltd', sector: 'Pharma', marketCap: '1,00,000' },
];

class IndianStockService {
  constructor() {
    this.cache = new Map();
    this.apiCallTimestamps = [];
    this.stocks = NIFTY_200_STOCKS;
  }

  // Rate limiting helper
  canMakeApiCall() {
    const now = Date.now();
    this.apiCallTimestamps = this.apiCallTimestamps.filter(
      timestamp => now - timestamp < 60000
    );
    return this.apiCallTimestamps.length < Config.MAX_API_CALLS_PER_MINUTE;
  }

  recordApiCall() {
    this.apiCallTimestamps.push(Date.now());
  }

  // Cache helpers
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < Config.CACHE_TTL;
  }

  getCachedData(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  setCacheData(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Generate mock Indian stock data
  generateMockIndianStockData(stockInfo) {
    const basePrice = Math.random() * 3000 + 100; // Random price between ₹100-₹3100
    const change = (Math.random() - 0.5) * 200; // Random change between -₹100 to +₹100
    const changePercent = (change / basePrice) * 100;
    
    // Generate buy/sell data
    const totalVolume = Math.floor(Math.random() * 1000000) + 100000;
    const buyRatio = 0.3 + Math.random() * 0.4; // 30-70% buy ratio
    const buyQuantity = Math.floor(totalVolume * buyRatio);
    const sellQuantity = totalVolume - buyQuantity;
    
    return {
      symbol: stockInfo.symbol,
      name: stockInfo.name,
      sector: stockInfo.sector,
      marketCap: stockInfo.marketCap,
      price: +basePrice.toFixed(2),
      change: +change.toFixed(2),
      changePercent: +changePercent.toFixed(2),
      volume: totalVolume,
      buyQuantity,
      sellQuantity,
      buyRatio: +(buyRatio * 100).toFixed(1),
      sellRatio: +((1 - buyRatio) * 100).toFixed(1),
      high: +(basePrice + Math.abs(change) + Math.random() * 50).toFixed(2),
      low: +(basePrice - Math.abs(change) - Math.random() * 50).toFixed(2),
      open: +basePrice.toFixed(2),
      previousClose: +basePrice.toFixed(2),
      dayHigh: +(basePrice + Math.random() * 100).toFixed(2),
      dayLow: +(basePrice - Math.random() * 100).toFixed(2),
      weekHigh52: +(basePrice + Math.random() * 500).toFixed(2),
      weekLow52: +(basePrice - Math.random() * 300).toFixed(2),
      pe: +(10 + Math.random() * 30).toFixed(1),
      pbv: +(1 + Math.random() * 5).toFixed(2),
      dividendYield: +(Math.random() * 5).toFixed(2),
      timestamp: Date.now()
    };
  }

  // Get all Nifty 200 stocks
  getAllStocks() {
    return this.stocks;
  }

  // Get stock by symbol
  getStockInfo(symbol) {
    return this.stocks.find(stock => stock.symbol === symbol);
  }

  // Get real-time quote for Indian stock
  async getIndianQuote(symbol) {
    const cacheKey = `indian_quote_${symbol}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      const stockInfo = this.getStockInfo(symbol);
      if (!stockInfo) {
        throw new Error(`Stock ${symbol} not found in Nifty 200`);
      }

      // Generate mock data (in production, use NSE/BSE API)
      const mockData = this.generateMockIndianStockData(stockInfo);
      this.setCacheData(cacheKey, mockData);
      return mockData;
    } catch (error) {
      console.error(`Error fetching Indian quote for ${symbol}:`, error);
      
      // Return cached data if available
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) return cachedData;
      
      // Fallback to basic stock info
      const stockInfo = this.getStockInfo(symbol);
      return stockInfo ? this.generateMockIndianStockData(stockInfo) : null;
    }
  }

  // Get multiple quotes
  async getMultipleIndianQuotes(symbols) {
    try {
      const promises = symbols.map(symbol => this.getIndianQuote(symbol));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching multiple Indian quotes:', error);
      return [];
    }
  }

  // Get top stocks by buy/sell ratio
  async getTopStocksByBuySellRatio(limit = 20) {
    try {
      const topSymbols = this.stocks.slice(0, limit).map(stock => stock.symbol);
      const quotes = await this.getMultipleIndianQuotes(topSymbols);
      
      // Sort by buy ratio (descending)
      return quotes.filter(quote => quote).sort((a, b) => b.buyRatio - a.buyRatio);
    } catch (error) {
      console.error('Error fetching top stocks by buy/sell ratio:', error);
      return [];
    }
  }

  // Get top gainers
  async getTopGainers(limit = 10) {
    try {
      const allSymbols = this.stocks.slice(0, 30).map(stock => stock.symbol);
      const quotes = await this.getMultipleIndianQuotes(allSymbols);
      
      return quotes
        .filter(quote => quote && quote.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top gainers:', error);
      return [];
    }
  }

  // Get top losers
  async getTopLosers(limit = 10) {
    try {
      const allSymbols = this.stocks.slice(0, 30).map(stock => stock.symbol);
      const quotes = await this.getMultipleIndianQuotes(allSymbols);
      
      return quotes
        .filter(quote => quote && quote.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top losers:', error);
      return [];
    }
  }

  // Search Indian stocks
  async searchIndianStocks(query) {
    try {
      const results = this.stocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase()) ||
        stock.sector.toLowerCase().includes(query.toLowerCase())
      );
      
      return results.slice(0, 10); // Limit to 10 results
    } catch (error) {
      console.error('Error searching Indian stocks:', error);
      return [];
    }
  }

  // Generate historical data for Indian stocks
  generateIndianHistoricalData(symbol, days = 30) {
    const data = [];
    const now = new Date();
    let basePrice = 500 + Math.random() * 2000; // Base price between ₹500-₹2500
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add market volatility
      basePrice += (Math.random() - 0.5) * 50;
      const open = basePrice;
      const high = basePrice + Math.random() * 30;
      const low = basePrice - Math.random() * 30;
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

  // Get historical data
  async getIndianHistoricalData(symbol, period = '1M') {
    const cacheKey = `indian_historical_${symbol}_${period}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      const days = this.getDaysFromPeriod(period);
      const mockData = this.generateIndianHistoricalData(symbol, days);
      this.setCacheData(cacheKey, mockData);
      return mockData;
    } catch (error) {
      console.error(`Error fetching Indian historical data for ${symbol}:`, error);
      
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) return cachedData;
      
      const days = this.getDaysFromPeriod(period);
      return this.generateIndianHistoricalData(symbol, days);
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

  // Format Indian Rupee currency
  formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format Indian number system (lakhs, crores)
  formatIndianNumber(num) {
    if (num >= 10000000) { // 1 crore
      return (num / 10000000).toFixed(1) + ' Cr';
    }
    if (num >= 100000) { // 1 lakh
      return (num / 100000).toFixed(1) + ' L';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('en-IN');
  }
}

// Export singleton instance
const indianStockService = new IndianStockService();
export default indianStockService;