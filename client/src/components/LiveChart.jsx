import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Maximize2, Settings, BarChart3 } from 'lucide-react';

const LiveChart = ({ symbol, data }) => {
  const canvasRef = useRef(null);
  const [timeframe, setTimeframe] = useState('1m');
  const [chartData, setChartData] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate realistic candlestick data
  useEffect(() => {
    if (!data) return;

    const generateCandlestickData = () => {
      const points = [];
      const now = Date.now();
      const basePrice = data.price || 1500;
      let currentPrice = basePrice;

      for (let i = 100; i >= 0; i--) {
        const timestamp = now - (i * 60000); // 1 minute intervals
        const volatility = basePrice * 0.002; // 0.2% volatility
        
        const open = currentPrice;
        const change = (Math.random() - 0.5) * volatility;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);
        const volume = Math.random() * 1000000 + 100000;

        points.push({
          timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.floor(volume)
        });

        currentPrice = close;
      }

      return points;
    };

    setChartData(generateCandlestickData());
  }, [data, symbol]);

  // Draw candlestick chart
  useEffect(() => {
    if (!chartData.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart dimensions - better alignment
    const padding = { top: 30, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find price range
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Scale functions
    const xScale = (index) => padding.left + (index / (chartData.length - 1)) * chartWidth;
    const yScale = (price) => padding.top + (1 - (price - minPrice) / priceRange) * chartHeight;

    // Draw grid with better styling
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = padding.top + (i / 8) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels with better formatting
      const price = maxPrice - (i / 8) * priceRange;
      ctx.fillStyle = '#64748b';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`₹${price.toFixed(1)}`, padding.left - 15, y + 3);
    }

    // Vertical grid lines
    const timeGridCount = 6;
    for (let i = 0; i <= timeGridCount; i++) {
      const x = padding.left + (i / timeGridCount) * chartWidth;
      ctx.strokeStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    // Draw candlesticks with better styling
    chartData.forEach((candle, index) => {
      const x = xScale(index);
      const openY = yScale(candle.open);
      const closeY = yScale(candle.close);
      const highY = yScale(candle.high);
      const lowY = yScale(candle.low);

      const isGreen = candle.close > candle.open;
      const candleWidth = Math.max(3, Math.min(8, chartWidth / chartData.length * 0.7));

      // Draw wick with better colors
      ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw candle body with gradient effect
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      
      if (bodyHeight < 2) {
        // Doji - draw thicker line
        ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.lineWidth = candleWidth;
        ctx.beginPath();
        ctx.moveTo(x - candleWidth / 2, bodyY);
        ctx.lineTo(x + candleWidth / 2, bodyY);
        ctx.stroke();
      } else {
        // Regular candle body
        if (isGreen) {
          ctx.fillStyle = '#22c55e';
          ctx.strokeStyle = '#16a34a';
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#dc2626';
        }
        
        ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
        ctx.lineWidth = 1;
        ctx.strokeRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
      }
    });

    // Draw current price line with better styling
    if (data && data.price) {
      const currentY = yScale(data.price);
      
      // Price line
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, currentY);
      ctx.lineTo(width - padding.right, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current price label with background
      const priceText = `₹${(data.price ?? 0).toFixed(2)}`;
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
      const textWidth = ctx.measureText(priceText).width;
      
      // Background rectangle
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(width - padding.right + 5, currentY - 10, textWidth + 8, 20);
      
      // Price text
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.fillText(priceText, width - padding.right + 9, currentY + 4);
    }

    // Time labels with better formatting
    const timePoints = [0, Math.floor(chartData.length / 5), Math.floor(chartData.length * 2 / 5), Math.floor(chartData.length * 3 / 5), Math.floor(chartData.length * 4 / 5), chartData.length - 1];
    timePoints.forEach(index => {
      if (chartData[index]) {
        const x = xScale(index);
        const time = new Date(chartData[index].timestamp);
        const timeStr = time.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        
        ctx.fillStyle = '#64748b';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, height - padding.bottom + 20);
      }
    });

  }, [chartData, data]);

  return (
    <div className="live-chart-container">
      <div className="chart-header">

      </div>

      <div className="chart-content">
        <canvas
          ref={canvasRef}
          width={1000}
          height={450}
          className="candlestick-chart"
        />
        
        {data && (
          <div className="chart-stats">
            <div className="stat-group">
              <span className="stat-label">HIGH</span>
              <span className="stat-value">₹{(data.high ?? 0).toFixed(2)}</span>
            </div>
            <div className="stat-group">
              <span className="stat-label">LOW</span>
              <span className="stat-value">₹{(data.low ?? 0).toFixed(2)}</span>
            </div>
            <div className="stat-group">
              <span className="stat-label">VOLUME</span>
              <span className="stat-value">{((data.volume ?? 0) / 100000).toFixed(1)}L</span>
            </div>
            <div className="stat-group">
              <span className="stat-label">MARKET CAP</span>
              <span className="stat-value">{data.marketCap}</span>
            </div>
            <div className="stat-group">
              <span className="stat-label">P/E</span>
              <span className="stat-value">{data.pe}</span>
            </div>
            <div className="stat-group">
              <span className="stat-label">P/B</span>
              <span className="stat-value">{data.pb}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChart;