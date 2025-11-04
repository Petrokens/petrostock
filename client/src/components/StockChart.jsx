import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import Config from '../config';

const StockChart = ({ symbol, data, timeframe, onTimeframeChange }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (data && data.length > 0) {
      // Transform data for recharts
      const transformedData = data.map(item => ({
        ...item,
        dateFormatted: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        fullDate: new Date(item.date)
      }));
      
      setChartData(transformedData);
      setIsLoading(false);
    } else if (data && data.length === 0) {
      setChartData([]);
      setIsLoading(false);
    }
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-date">{data.fullDate.toLocaleDateString()}</p>
          <div className="tooltip-content">
            <p className="tooltip-price">
              Close: <span className="price-value">${data.close}</span>
            </p>
            <p className="tooltip-range">
              High: <span>${data.high}</span> | Low: <span>${data.low}</span>
            </p>
            <p className="tooltip-volume">
              Volume: <span>{(data.volume / 1000000).toFixed(1)}M</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getLineColor = () => {
    if (chartData.length < 2) return '#10b981';
    
    const firstPrice = chartData[0]?.close || 0;
    const lastPrice = chartData[chartData.length - 1]?.close || 0;
    
    if (lastPrice > firstPrice) return '#10b981'; // Green for gain
    if (lastPrice < firstPrice) return '#ef4444'; // Red for loss
    return '#6b7280'; // Gray for no change
  };

  if (isLoading) {
    return (
      <div className="stock-chart">
        <div className="chart-header">
          <h3 className="chart-title">{symbol} Stock Chart</h3>
          <div className="timeframe-selector">
            {Config.DEFAULT_TIMEFRAMES.map(tf => (
              <button
                key={tf}
                className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => onTimeframeChange(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-loading">
          <div className="loading-skeleton chart-skeleton"></div>
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-chart">
      <div className="chart-header">
        <h3 className="chart-title">{symbol} Stock Chart</h3>
        <div className="timeframe-selector">
          {Config.DEFAULT_TIMEFRAMES.map(tf => (
            <button
              key={tf}
              className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => onTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={Config.DEFAULT_CHART_HEIGHT}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="dateFormatted"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="close"
              stroke={getLineColor()}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: getLineColor(), strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-footer">
        <div className="chart-stats">
          {chartData.length > 0 && (
            <>
              <div className="stat">
                <span className="stat-label">Period Range:</span>
                <span className="stat-value">
                  ${Math.min(...chartData.map(d => d.low)).toFixed(2)} - 
                  ${Math.max(...chartData.map(d => d.high)).toFixed(2)}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Avg Volume:</span>
                <span className="stat-value">
                  {(chartData.reduce((sum, d) => sum + d.volume, 0) / chartData.length / 1000000).toFixed(1)}M
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockChart;