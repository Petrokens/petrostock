import { useState, useEffect } from 'react';
import Config from '../config';

const SimpleStockChart = ({ symbol, data, timeframe, onTimeframeChange }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      setChartData(data);
      setIsLoading(false);
    } else {
      setChartData([]);
      setIsLoading(false);
    }
  }, [data]);

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
        <div className="simple-chart" style={{ height: Config.DEFAULT_CHART_HEIGHT }}>
          {chartData.length > 0 ? (
            <div className="chart-placeholder">
              <div className="chart-info">
                <h4>Stock Data for {symbol}</h4>
                <div className="data-summary">
                  <div className="summary-item">
                    <span>Period: {timeframe}</span>
                  </div>
                  <div className="summary-item">
                    <span>Data Points: {chartData.length}</span>
                  </div>
                  <div className="summary-item">
                    <span>Price Range: ${Math.min(...chartData.map(d => d.low)).toFixed(2)} - ${Math.max(...chartData.map(d => d.high)).toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Latest Close: ${chartData[chartData.length - 1]?.close.toFixed(2) || 'N/A'}</span>
                  </div>
                </div>
                
                {/* Simple Visual Representation */}
                <div className="price-bars">
                  {chartData.slice(-10).map((item, index) => {
                    const maxPrice = Math.max(...chartData.map(d => d.high));
                    const minPrice = Math.min(...chartData.map(d => d.low));
                    const range = maxPrice - minPrice;
                    const height = range > 0 ? ((item.close - minPrice) / range) * 100 : 50;
                    
                    return (
                      <div key={index} className="price-bar-container">
                        <div 
                          className="price-bar"
                          style={{ 
                            height: `${height}%`,
                            backgroundColor: getLineColor(),
                            opacity: 0.7 + (index * 0.03)
                          }}
                        ></div>
                        <span className="bar-date">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data">
              <p>No chart data available for {symbol}</p>
            </div>
          )}
        </div>
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

export default SimpleStockChart;