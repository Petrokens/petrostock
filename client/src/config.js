// Configuration for Stock Market Tracker
export const Config = {
  // API Keys - In production, these should be set via environment variables
  ALPHA_VANTAGE_API_KEY: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo',
  FINNHUB_API_KEY: import.meta.env.VITE_FINNHUB_API_KEY || 'demo',
  YAHOO_FINANCE_API_KEY: import.meta.env.VITE_YAHOO_FINANCE_API_KEY || '',
  USE_FALLBACK_DATA: (import.meta.env.VITE_USE_FALLBACK_DATA || 'true') === 'true',
  // Use NSE unofficial API endpoint (note: CORS and scraping protections may apply)
  USE_NSE_API: (import.meta.env.VITE_USE_NSE_API || 'false') === 'true',
  NSE_BASE_URL: import.meta.env.VITE_NSE_BASE_URL || 'https://www.nseindia.com/api/quote-equity',
  
  // App Settings
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Stock Market Tracker',
  CACHE_TTL: parseInt(import.meta.env.VITE_CACHE_TTL) || 300000, // 5 minutes in ms
  MAX_API_CALLS_PER_MINUTE: parseInt(import.meta.env.VITE_MAX_API_CALLS_PER_MINUTE) || 60,
  
  // API URLs
  ALPHA_VANTAGE_BASE_URL: "https://www.alphavantage.co/query",
  FINNHUB_BASE_URL: "https://finnhub.io/api/v1",
  
  // Chart settings
  DEFAULT_CHART_HEIGHT: 400,
  DEFAULT_TIMEFRAMES: ['1D', '5D', '1M', '3M', '6M', '1Y', '2Y', '5Y'],
  
  // Technical indicators
  DEFAULT_SMA_PERIODS: [20, 50, 200],
  DEFAULT_EMA_PERIODS: [12, 26],
  DEFAULT_RSI_PERIOD: 14,
  
  // Update intervals (in milliseconds)
  REAL_TIME_UPDATE_INTERVAL: 5000, // 5 seconds
  CLOCK_UPDATE_INTERVAL: 1000, // 1 second
  
  // Sample stock symbols for demo
  DEFAULT_STOCKS: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META']
};

export default Config;