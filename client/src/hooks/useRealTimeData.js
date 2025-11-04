import { useState, useEffect, useRef } from 'react';
import stockService from '../services/stockService';

const useRealTimeData = (symbols, interval = 5000) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Use refs to avoid recreating functions
  const symbolsRef = useRef(symbols);
  const intervalRef = useRef(null);

  // Update ref when symbols change
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  const fetchData = async (symbolsToFetch) => {
    if (!symbolsToFetch || symbolsToFetch.length === 0) return;

    // Set loading state for all symbols
    const loadingState = {};
    symbolsToFetch.forEach(symbol => {
      loadingState[symbol] = true;
    });
    setLoading(prev => ({ ...prev, ...loadingState }));

    try {
      const quotes = await stockService.getMultipleQuotes(symbolsToFetch);
      const newData = {};

      quotes.forEach((quote, index) => {
        const symbol = symbolsToFetch[index];
        if (quote) {
          newData[symbol] = {
            ...quote,
            lastUpdated: Date.now()
          };
        }
      });

      setData(prev => ({ ...prev, ...newData }));
      setErrors(prev => {
        const updated = { ...prev };
        // Clear errors for successful fetches
        symbolsToFetch.forEach(symbol => {
          if (newData[symbol]) {
            delete updated[symbol];
          }
        });
        return updated;
      });
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      
      const errorState = {};
      symbolsToFetch.forEach(symbol => {
        errorState[symbol] = error.message || 'Unknown error';
      });
      setErrors(prev => ({ ...prev, ...errorState }));
    } finally {
      // Clear loading state
      const clearedLoading = {};
      symbolsToFetch.forEach(symbol => {
        clearedLoading[symbol] = false;
      });
      setLoading(prev => ({ ...prev, ...clearedLoading }));
    }
  };

  // Initial load and interval setup
  useEffect(() => {
    const currentSymbols = symbolsRef.current;
    
    if (!currentSymbols || currentSymbols.length === 0) return;

    // Initial fetch
    fetchData(currentSymbols);

    // Set up interval
    intervalRef.current = setInterval(() => {
      fetchData(symbolsRef.current);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval]); // Only depend on interval

  // Handle symbol changes
  useEffect(() => {
    if (symbols && symbols.length > 0) {
      fetchData(symbols);
    }
  }, [symbols]);

  // Method to manually refresh data
  const refreshData = useCallback((symbolsToRefresh) => {
    const targetSymbols = symbolsToRefresh || symbols;
    if (targetSymbols && targetSymbols.length > 0) {
      fetchData(targetSymbols);
    }
  }, [symbols, fetchData]);

  // Method to add new symbols to tracking
  const addSymbols = useCallback((newSymbols) => {
    const symbolsToAdd = Array.isArray(newSymbols) ? newSymbols : [newSymbols];
    fetchData(symbolsToAdd);
  }, [fetchData]);

  // Method to get data for a specific symbol
  const getSymbolData = useCallback((symbol) => {
    return {
      data: data[symbol] || null,
      loading: loading[symbol] || false,
      error: errors[symbol] || null,
      lastUpdated: data[symbol]?.lastUpdated || null
    };
  }, [data, loading, errors]);

  // Calculate update status
  const getUpdateStatus = useCallback(() => {
    if (!lastUpdate) return 'never';
    
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdate;
    
    if (timeSinceUpdate < 10000) return 'recent'; // Less than 10 seconds
    if (timeSinceUpdate < 30000) return 'normal'; // Less than 30 seconds
    return 'stale'; // More than 30 seconds
  }, [lastUpdate]);

  return {
    data,
    loading,
    errors,
    lastUpdate,
    refreshData,
    addSymbols,
    getSymbolData,
    getUpdateStatus,
    isConnected: true
  };
};

export default useRealTimeData;