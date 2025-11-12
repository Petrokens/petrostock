// Live Stock Data Server with WebSocket Support
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const API_KEY = 'eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NjI5OTM4MDAsImlhdCI6MTc2MjkyNDkxMSwibmJmIjoxNzYyOTI0OTExLCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJlYzI1NjU4Yi05MDFlLTQ1ZjYtYThlNy01NDliYTlmNTNlOGJcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiNmQ1ZTZlZTgtYzcxZS00MjQ2LTk4MTctN2I3NGIxYmQyYTJkXCIsXCJkZXZpY2VJZFwiOlwiNGE1Y2U5ZDItMDc5NS01ZmY0LWE3ZWMtMWRlMjJmNDYyZjI1XCIsXCJzZXNzaW9uSWRcIjpcIjgyNjk5YTU1LWI5MmMtNGI0YS1hZjliLTQxNTgyM2Y5Y2EyZFwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYkVtQk5acTk4a2RYRXdzbTFTWUJqM1ZSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcIm9yZGVyLWJhc2ljLGxpdmVfZGF0YS1iYXNpYyxub25fdHJhZGluZy1iYXNpYyxvcmRlcl9yZWFkX29ubHktYmFzaWMsYmFja190ZXN0XCIsXCJzb3VyY2VJcEFkZHJlc3NcIjpcIjExNS45Ny4yNTMuMjQxLDE3Mi43MC4yMTguMTIzLDM1LjI0MS4yMy4xMjNcIixcInR3b0ZhRXhwaXJ5VHNcIjoxNzYyOTkzODAwMDAwfSIsImlzcyI6ImFwZXgtYXV0aC1wcm9kLWFwcCJ9.X5t1Y2w0TpWfUgLCQ0utLtsYs0hqUwVgtM9nmMtWstcMt6237ub5jjtgTFMT_K3QC9YwKGtEb9uOxchid6FsJw';

// In-memory cache for stock data
const stockCache = new Map();
const symbolToNameMap = new Map(); // Map trading symbol to company name
const CACHE_TTL = 5000; // 5 seconds cache
const INSTRUMENTS_CACHE_TTL = 86400000; // 24 hours for instruments list

    // Enable CORS
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running!', 
    time: new Date(),
    connections: io.engine.clientsCount
  });
});

// Instruments endpoint - fetch/refresh instruments list
app.get('/api/instruments', async (req, res) => {
  try {
    const success = await fetchInstrumentsList();
    if (success) {
      res.json({ 
        status: 'SUCCESS', 
        message: `Loaded ${symbolToNameMap.size} instruments`,
        count: symbolToNameMap.size
      });
    } else {
      res.status(404).json({ 
        status: 'ERROR', 
        message: 'Could not fetch instruments from any endpoint' 
      });
    }
  } catch (error) {
    console.error('Error fetching instruments:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Stock data endpoint
app.get('/api/stock', async (req, res) => {
  const { symbol } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  try {
    const data = await fetchStockData(symbol);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch instruments list from Groww CSV to get trading symbols and company names
async function fetchInstrumentsList() {
  try {
    const csvUrl = 'https://growwapi-assets.groww.in/instruments/instrument.csv';
    
    console.log(`Downloading Instruments CSV from: ${csvUrl}`);
    
    const response = await fetch(csvUrl, {
      headers: {
        'Accept': 'text/csv',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log(`Downloaded CSV (${csvText.length} characters)`);
    
    // Parse CSV
    const lines = csvText.split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty or invalid');
    }

    // Find header row and column indices
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    
    const tradingSymbolIdx = headers.findIndex(h => h === 'trading_symbol');
    const nameIdx = headers.findIndex(h => h === 'name');
    const exchangeIdx = headers.findIndex(h => h === 'exchange');
    const segmentIdx = headers.findIndex(h => h === 'segment');

    if (tradingSymbolIdx === -1 || nameIdx === -1) {
      throw new Error('CSV missing required columns: trading_symbol or name');
    }

    console.log(`CSV Headers: trading_symbol=${tradingSymbolIdx}, name=${nameIdx}, exchange=${exchangeIdx}, segment=${segmentIdx}`);

    // Helper function to parse CSV line handling quoted fields
    function parseCSVLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim()); // Add last field
      return result;
    }

    // Parse data rows (skip header)
    let count = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Parse CSV line handling quoted fields
      const columns = parseCSVLine(line);
      
      if (columns.length > Math.max(tradingSymbolIdx, nameIdx)) {
        const tradingSymbol = columns[tradingSymbolIdx];
        const name = columns[nameIdx];
        const exchange = exchangeIdx >= 0 ? columns[exchangeIdx] : 'NSE';
        const segment = segmentIdx >= 0 ? columns[segmentIdx] : 'CASH';
        
        // Only map CASH segment stocks (exclude FNO derivatives)
        if (tradingSymbol && name && segment === 'CASH' && exchange === 'NSE') {
          // Filter out NaN names and ensure name is valid
          if (name && name !== 'NaN' && name !== 'nan' && name !== '' && tradingSymbol.length > 0) {
            symbolToNameMap.set(tradingSymbol, name);
          }
        }
        count++;
      }
      
      // Log progress for large files
      if (count % 10000 === 0) {
        console.log(`Processed ${count} rows, found ${symbolToNameMap.size} NSE CASH instruments...`);
      }
    }

    console.log(`Parsed ${count} total instruments from CSV`);
    console.log(`Loaded ${symbolToNameMap.size} NSE CASH segment mappings (trading_symbol -> name)`);
    
    if (symbolToNameMap.size > 0) {
      // Log a few examples with common stocks
      const commonStocks = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY'];
      const examples = commonStocks
        .filter(sym => symbolToNameMap.has(sym))
        .map(sym => `${sym} -> ${symbolToNameMap.get(sym)}`)
        .slice(0, 5);
      
      if (examples.length > 0) {
        console.log(`Examples: ${examples.join(', ')}`);
      }
      return true;
    }
    
    throw new Error('No valid instrument mappings found');
  } catch (error) {
    console.error(`Error fetching instruments CSV:`, error.message);
    return false;
  }
}

// Initialize instruments mapping on server start
fetchInstrumentsList().then(success => {
  if (success) {
    console.log(`Instruments mapping loaded successfully`);
  } else {
    console.log(`Instruments mapping not available - will use symbols as names`);
  }
});

// Fetch stock data from Groww API using Quote endpoint for complete data
async function fetchStockData(symbol) {
  const cacheKey = symbol;
  const cached = stockCache.get(cacheKey);
  
  // Return cached data if valid
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`Using cached data for ${symbol}`);
    return cached.data;
  }

  try {
    // Use Quote API for complete data (includes OHLC, volume, etc.)
    const quoteApiUrl = `https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=${symbol}`;
    
    console.log(`Fetching ${symbol} from Groww Quote API...`);
    
    const response = await fetch(quoteApiUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-VERSION': '1.0'
      }
    });

    console.log(`Groww Quote API Response for ${symbol}: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Quote API Error for ${symbol}: ${response.status} - ${errorText}`);
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log(`Groww Quote API Response for ${symbol}:`, JSON.stringify(data).substring(0, 300));
    
    if (data.status === 'SUCCESS' && data.payload) {
      const payload = data.payload;
      const price = parseFloat(payload.last_price || payload.last_trade_price || 0);
      const change = parseFloat(payload.day_change || 0);
      const changePercent = parseFloat(payload.day_change_perc || 0);
      
      // Parse OHLC if it's a string
      let ohlcData = {};
      if (payload.ohlc) {
        if (typeof payload.ohlc === 'string') {
          // Parse string like "{open: 149.50,high: 150.50,low: 148.50,close: 149.50}"
          try {
            const ohlcStr = payload.ohlc.replace(/{|}/g, '');
            const parts = ohlcStr.split(',');
            parts.forEach(part => {
              const [key, value] = part.split(':').map(s => s.trim());
              if (key && value) ohlcData[key] = parseFloat(value);
            });
          } catch (e) {
            console.log(`Could not parse OHLC string for ${symbol}`);
          }
        } else {
          ohlcData = payload.ohlc;
        }
      }
      
      // Get company name from Instruments mapping
      // If mapping is empty, try to reload it
      let companyName = symbolToNameMap.get(symbol) || symbol;
      
      // If mapping doesn't have this symbol, try to refresh instruments list in background
      if (!symbolToNameMap.has(symbol) && symbolToNameMap.size === 0) {
        fetchInstrumentsList().catch(err => {
          console.log(`Could not refresh instruments list: ${err.message}`);
        });
      }
      
      console.log(`Fetched ${symbol}: ₹${price}${companyName !== symbol ? ` (${companyName})` : ''}`);
      
      const stockData = {
        symbol: symbol,
        name: companyName, // Using symbol as name (Groww API doesn't provide company names)
        last: price,
        chg: change,
        pchg: changePercent,
        vol: parseInt(payload.volume || (payload.total_buy_quantity || 0) + (payload.total_sell_quantity || 0) || 0),
        high: parseFloat(payload.high_trade_range || ohlcData.high || payload.week_52_high || price * 1.02 || price),
        low: parseFloat(payload.low_trade_range || ohlcData.low || payload.week_52_low || price * 0.98 || price),
        open: parseFloat(ohlcData.open || payload.last_price || price),
        previousClose: parseFloat(ohlcData.close || payload.last_price - change || price),
        timestamp: Date.now()
      };

      // Cache the data
      stockCache.set(cacheKey, {
        data: stockData,
        timestamp: Date.now()
      });

      return stockData;
    } else {
      console.error(`Invalid Quote API response format for ${symbol}:`, JSON.stringify(data));
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error(`Error fetching ${symbol} from Quote API:`, error.message);
    
    // Fallback to LTP API if Quote API fails
    try {
      console.log(`Falling back to LTP API for ${symbol}...`);
        const exchangeSymbol = `NSE_${symbol}`;
      const ltpApiUrl = `https://api.groww.in/v1/live-data/ltp?segment=CASH&exchange_symbols=${exchangeSymbol}`;
        
      const ltpResponse = await fetch(ltpApiUrl, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'X-API-VERSION': '1.0'
            }
      });

      if (ltpResponse.ok) {
        const ltpData = await ltpResponse.json();
        if (ltpData.status === 'SUCCESS' && ltpData.payload && ltpData.payload[exchangeSymbol]) {
          const price = parseFloat(ltpData.payload[exchangeSymbol]);
          const previousData = cached?.data;
          const previousPrice = previousData?.last || price;
          const change = price - previousPrice;
          const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;
          
          // Get company name from Instruments mapping (same as main API)
          let companyName = symbolToNameMap.get(symbol) || symbol;
          
          const stockData = {
            symbol: symbol,
            name: companyName,
            last: price,
            chg: parseFloat(change.toFixed(2)),
            pchg: parseFloat(changePercent.toFixed(2)),
            vol: Math.floor(Math.random() * 1000000) + 500000,
            high: price * 1.02,
            low: price * 0.98,
            open: previousPrice,
            previousClose: previousPrice,
            timestamp: Date.now()
          };
          
          stockCache.set(cacheKey, {
            data: stockData,
            timestamp: Date.now()
          });
          
          return stockData;
        }
      }
    } catch (ltpError) {
      console.error(`LTP fallback also failed for ${symbol}:`, ltpError.message);
    }
    
    // Return cached data if available, even if expired
    if (cached) {
      console.log(`Returning expired cache for ${symbol}`);
      return cached.data;
    }
    
    throw error;
  }
}

// Fetch multiple stocks
async function fetchMultipleStocks(symbols) {
  const results = [];
  
  for (const symbol of symbols) {
    try {
      const data = await fetchStockData(symbol);
      if (data) {
        results.push(data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error.message);
      // Continue with other symbols - don't fail entire batch
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle stock subscription
  socket.on('subscribeStocks', async (symbols) => {
    console.log(`Client ${socket.id} subscribed to ${symbols.length} stocks: ${symbols.slice(0, 5).join(', ')}${symbols.length > 5 ? '...' : ''}`);
    
    // Fetch data progressively in batches
    const batchSize = 3; // Smaller batches to avoid rate limiting
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      try {
        console.log(`Fetching batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(symbols.length/batchSize)}: ${batch.join(', ')}`);
        const stocksData = await fetchMultipleStocks(batch);
        
        if (stocksData.length > 0) {
          socket.emit('priceUpdate', stocksData);
          console.log(`Sent batch ${Math.floor(i/batchSize) + 1}: ${stocksData.length} stocks`);
                        } else {
          console.warn(`No data returned for batch: ${batch.join(', ')}`);
        }
        
        // Delay between batches to avoid rate limiting
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error fetching batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        // Continue with next batch
      }
    }
    
    console.log(`Finished processing subscription for ${symbols.length} stocks`);
  });

  // Handle single stock requests
  socket.on('requestStock', async (symbol) => {
    try {
      const data = await fetchStockData(symbol);
      socket.emit('priceUpdate', [data]);
      console.log(`Sent ${symbol} to ${socket.id}`);
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      socket.emit('stockError', { symbol, error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Periodic update for all connected clients
setInterval(async () => {
  const connectedSockets = await io.fetchSockets();
  
  if (connectedSockets.length > 0 && stockCache.size > 0) {
    console.log(`Periodic update for ${connectedSockets.length} clients...`);
    
    // Get all cached symbols
    const symbols = Array.from(stockCache.keys());
    
    // Update in batches
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      try {
        const updates = await fetchMultipleStocks(batch);
        
        if (updates.length > 0) {
          io.emit('priceUpdate', updates);
          console.log(`Broadcasted ${updates.length} updates`);
        }
      } catch (error) {
        console.error('Error in periodic update:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}, 10000); // Update every 10 seconds

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════');
  console.log('  LIVE STOCK DATA SERVER');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Server: http://localhost:${PORT}`);
  console.log(`  WebSocket: Ready`);
    console.log(`  API Key: Configured`);
    console.log('');
  console.log('  Waiting for client connections...');
    console.log('═══════════════════════════════════════════════');
    console.log('');
});

