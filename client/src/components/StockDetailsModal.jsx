import { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, TrendingDown, Volume2, Calendar, DollarSign, Percent } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import indianStockService from '../services/indianStockService';
import Config from '../config';

const StockDetailsModal = ({ stock, isOpen, onClose }) => {
  const [chartData, setChartData] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [isLoading, setIsLoading] = useState(true);
  const [liveData, setLiveData] = useState(stock);

  useEffect(() => {
    if (isOpen && stock) {
      loadChartData();
      startLiveUpdates();
    }
    
    return () => {
      // Cleanup live updates when modal closes
    };
  }, [isOpen, stock, selectedTimeframe]);

  const loadChartData = async () => {
    if (!stock) return;
    
    setIsLoading(true);
    try {
      const historicalData = await indianStockService.getIndianHistoricalData(stock.symbol, selectedTimeframe);
      setChartData(historicalData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startLiveUpdates = () => {
    if (!stock) return;
    
    const updateData = async () => {
      try {
        const updatedStock = await indianStockService.getIndianQuote(stock.symbol);
        if (updatedStock) {
          setLiveData(updatedStock);
        }
      } catch (error) {
        console.error('Error updating live data:', error);
      }
    };

    // Initial update
    updateData();
    
    // Set up interval for live updates
    const interval = setInterval(updateData, Config.REAL_TIME_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="modal-chart-tooltip">
          <p className="tooltip-date">{new Date(data.date).toLocaleDateString('en-IN')}</p>
          <div className="tooltip-content">
            <p className="tooltip-price">
              Close: <span className="price-value">{indianStockService.formatINR(data.close)}</span>
            </p>
            <p className="tooltip-range">
              High: <span>{indianStockService.formatINR(data.high)}</span> | 
              Low: <span>{indianStockService.formatINR(data.low)}</span>
            </p>
            <p className="tooltip-volume">
              Volume: <span>{indianStockService.formatIndianNumber(data.volume)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isOpen || !stock) return null;

  const isPositive = liveData.change >= 0;
  const isNeutral = liveData.change === 0;

  return (
    <div className="stock-modal-overlay" onClick={onClose}>
      <div className="stock-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="stock-header-info">
            <div className="stock-title">
              <h1 className="stock-symbol">{liveData.symbol}</h1>
              <div className={`current-price ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}>
                {indianStockService.formatINR(liveData.price)}
                <div className="price-change">
                  {isPositive ? <TrendingUp size={18} /> : isNeutral ? null : <TrendingDown size={18} />}
                  <span>{isPositive ? '+' : ''}{indianStockService.formatINR(liveData.change)}</span>
                  <span className="change-percent">({isPositive ? '+' : ''}{liveData.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            </div>
            <div className="stock-meta">
              <h2 className="company-name">{liveData.name}</h2>
              <div className="sector-market-cap">
                <span className="sector-tag">{liveData.sector}</span>
                <span className="market-cap">Market Cap: ₹{liveData.marketCap} Cr</span>
              </div>
            </div>
          </div>
          
          <button className="close-modal-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Live Stats Section */}
        <div className="modal-live-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <Volume2 size={16} />
                <span>Buy/Sell Ratio</span>
              </div>
              <div className="buy-sell-visual">
                <div className="ratio-bar-large">
                  <div 
                    className="buy-fill-large" 
                    style={{ width: `${liveData.buyRatio}%` }}
                  ></div>
                </div>
                <div className="ratio-numbers">
                  <span className="buy-number">{liveData.buyRatio}% Buy ({indianStockService.formatIndianNumber(liveData.buyQuantity)})</span>
                  <span className="sell-number">{liveData.sellRatio}% Sell ({indianStockService.formatIndianNumber(liveData.sellQuantity)})</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <BarChart3 size={16} />
                <span>Day Range</span>
              </div>
              <div className="day-range">
                <div className="range-bar">
                  <span className="range-low">{indianStockService.formatINR(liveData.dayLow)}</span>
                  <div className="range-indicator">
                    <div className="range-line"></div>
                    <div 
                      className="current-position" 
                      style={{ 
                        left: `${((liveData.price - liveData.dayLow) / (liveData.dayHigh - liveData.dayLow)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="range-high">{indianStockService.formatINR(liveData.dayHigh)}</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Calendar size={16} />
                <span>52 Week Range</span>
              </div>
              <div className="week-range">
                <div className="range-values">
                  <span className="week-low">Low: {indianStockService.formatINR(liveData.weekLow52)}</span>
                  <span className="week-high">High: {indianStockService.formatINR(liveData.weekHigh52)}</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <DollarSign size={16} />
                <span>Key Ratios</span>
              </div>
              <div className="key-ratios">
                <div className="ratio-item">
                  <span className="ratio-label">P/E Ratio:</span>
                  <span className="ratio-value">{liveData.pe}</span>
                </div>
                <div className="ratio-item">
                  <span className="ratio-label">P/B Ratio:</span>
                  <span className="ratio-value">{liveData.pbv}</span>
                </div>
                <div className="ratio-item">
                  <span className="ratio-label">Dividend Yield:</span>
                  <span className="ratio-value">{liveData.dividendYield}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="modal-chart-section">
          <div className="chart-header">
            <h3>Price Chart</h3>
            <div className="timeframe-selector">
              {Config.DEFAULT_TIMEFRAMES.map(tf => (
                <button
                  key={tf}
                  className={`timeframe-btn ${selectedTimeframe === tf ? 'active' : ''}`}
                  onClick={() => handleTimeframeChange(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container-modal">
            {isLoading ? (
              <div className="chart-loading">
                <div className="loading-skeleton chart-skeleton-large"></div>
                <p>Loading chart data...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={isPositive ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="modal-additional-details">
          <div className="details-grid">
            <div className="detail-section">
              <h4>Trading Information</h4>
              <div className="detail-items">
                <div className="detail-item">
                  <span className="label">Open:</span>
                  <span className="value">{indianStockService.formatINR(liveData.open)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Previous Close:</span>
                  <span className="value">{indianStockService.formatINR(liveData.previousClose)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Volume:</span>
                  <span className="value">{indianStockService.formatIndianNumber(liveData.volume)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Market Information</h4>
              <div className="detail-items">
                <div className="detail-item">
                  <span className="label">Market Cap:</span>
                  <span className="value">₹{liveData.marketCap} Crores</span>
                </div>
                <div className="detail-item">
                  <span className="label">Sector:</span>
                  <span className="value">{liveData.sector}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Last Updated:</span>
                  <span className="value">{new Date(liveData.timestamp).toLocaleTimeString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailsModal;