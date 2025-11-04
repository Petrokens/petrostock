import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Maximize2, Settings } from 'lucide-react';

const LiveTradingChart = ({ symbol, price, change, changePercent }) => {
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('candlestick');
  const canvasRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timeframes = ['1m', '5m', '15m', '30m', '1H', '1D', '1W'];

  // Generate realistic intraday data
  useEffect(() => {
    const generateIntradayData = () => {
      const data = [];
      const now = new Date();
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 15); // 9:15 AM
      let currentPrice = price || 2000;
      
      for (let i = 0; i < 390; i++) { // 390 minutes in trading day
        const time = new Date(startTime.getTime() + i * 60000);
        const volatility = 0.02; // 2% volatility
        const randomChange = (Math.random() - 0.5) * volatility * currentPrice;
        
        const open = currentPrice;
        const close = currentPrice + randomChange;
        const high = Math.max(open, close) + Math.random() * 10;
        const low = Math.min(open, close) - Math.random() * 10;
        const volume = Math.floor(Math.random() * 100000) + 50000;
        
        data.push({
          time: time.getTime(),
          timeStr: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume
        });
        
        currentPrice = close;
      }
      return data;
    };

    setChartData(generateIntradayData());
    
    // Update chart every 5 seconds with new data point
    const interval = setInterval(() => {
      setChartData(prevData => {
        if (prevData.length === 0) return prevData;
        
        const newData = [...prevData];
        const lastCandle = newData[newData.length - 1];
        const now = new Date();
        
        // Update last candle or add new one
        if (now.getMinutes() !== new Date(lastCandle.time).getMinutes()) {
          // New minute, add new candle
          const newPrice = lastCandle.close + (Math.random() - 0.5) * 20;
          newData.push({
            time: now.getTime(),
            timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            open: lastCandle.close,
            high: Math.max(lastCandle.close, newPrice) + Math.random() * 5,
            low: Math.min(lastCandle.close, newPrice) - Math.random() * 5,
            close: parseFloat(newPrice.toFixed(2)),
            volume: Math.floor(Math.random() * 100000) + 50000
          });
        } else {
          // Update current candle
          const updatedClose = lastCandle.close + (Math.random() - 0.5) * 5;
          newData[newData.length - 1] = {
            ...lastCandle,
            close: parseFloat(updatedClose.toFixed(2)),
            high: Math.max(lastCandle.high, updatedClose),
            low: Math.min(lastCandle.low, updatedClose),
          };
        }
        
        return newData.slice(-390); // Keep last 390 data points
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [price]);

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart settings
    const padding = { top: 20, right: 60, bottom: 50, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Get price range
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (priceRange * i) / 5;
      ctx.fillStyle = '#64748b';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`₹${price.toFixed(2)}`, width - padding.right + 5, y + 4);
    }

    // Vertical grid lines
    const timeStep = Math.max(1, Math.floor(chartData.length / 6));
    for (let i = 0; i < chartData.length; i += timeStep) {
      const x = padding.left + (chartWidth * i) / (chartData.length - 1);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      
      // Time labels
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(chartData[i].timeStr, x, height - padding.bottom + 20);
    }

    // Draw candlesticks
    const candleWidth = Math.max(2, chartWidth / chartData.length * 0.8);
    
    chartData.forEach((candle, index) => {
      const x = padding.left + (chartWidth * index) / (chartData.length - 1);
      const openY = padding.top + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * chartHeight;
      const highY = padding.top + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding.top + ((maxPrice - candle.low) / priceRange) * chartHeight;

      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#22c55e' : '#ef4444';
      
      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      
      if (isGreen) {
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      } else {
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      }
    });

    // Draw current price line
    if (chartData.length > 0) {
      const currentPrice = chartData[chartData.length - 1].close;
      const priceY = padding.top + ((maxPrice - currentPrice) / priceRange) * chartHeight;
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, priceY);
      ctx.lineTo(width - padding.right, priceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Current price label
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(width - padding.right, priceY - 10, 50, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`₹${currentPrice}`, width - padding.right + 25, priceY + 4);
    }
  }, [chartData]);

  return (
    <div className={`live-chart-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="chart-header">
        <div className="chart-info">
          <div className="symbol-info">
            <span className="chart-symbol">{symbol}</span>
            <div className="price-info">
              <span className="current-price">₹{price?.toLocaleString('en-IN')}</span>
              <span className={`price-change ${change >= 0 ? 'positive' : 'negative'}`}>
                {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {change >= 0 ? '+' : ''}₹{Math.abs(change).toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent?.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        
        <div className="chart-controls">
          <div className="timeframe-buttons">
            {timeframes.map(tf => (
              <button
                key={tf}
                className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <div className="chart-actions">
            <button className="chart-action-btn" title="Settings">
              <Settings size={16} />
            </button>
            <button 
              className="chart-action-btn" 
              title="Fullscreen"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="chart-area">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className="chart-footer">
        <div className="volume-info">
          <span>Volume: {chartData[chartData.length - 1]?.volume?.toLocaleString('en-IN')}</span>
        </div>
        <div className="chart-status">
          <div className="live-indicator">
            <div className="pulse-dot"></div>
            <span>Live</span>
          </div>
          <span className="last-updated">
            Last updated: {new Date().toLocaleTimeString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveTradingChart;