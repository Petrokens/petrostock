import fs from 'fs';
import LiveStockAPI from './src/services/LiveStockAPI.js';

// Simple .env loader for Node.js testing
function loadEnvFile() {
  try {
    const envFile = fs.readFileSync('./.env', 'utf8');
    const lines = envFile.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
        console.log(`Loaded: ${key.trim()} = ${value.substring(0, 20)}...`);
      }
    });
    console.log('✅ Environment variables loaded from .env');
  } catch (error) {
    console.warn('⚠️ Could not load .env file:', error.message);
  }
}

(async () => {
  try {
    // Load environment variables
    loadEnvFile();
    
    const api = new LiveStockAPI();
    console.log('Instantiated LiveStockAPI');

    const stock = await api.fetchStockData('RELIANCE');
    console.log('Single stock result:', JSON.stringify(stock, null, 2));

    const multi = await api.fetchMultipleStocks(['RELIANCE','TCS','INFY']);
    console.log('Multiple stocks result keys:', Object.keys(multi));

    const index = await api.fetchNiftyIndexData();
    console.log('NIFTY index result:', JSON.stringify(index, null, 2));

    // Force refresh
    const refreshed = await api.forceRefreshStock('TCS');
    console.log('Force refreshed TCS:', refreshed.symbol, refreshed.price);

    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(2);
  }
})();