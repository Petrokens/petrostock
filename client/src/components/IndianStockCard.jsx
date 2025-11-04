import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, BarChart3 } from 'lucide-react';
import indianStockService from '../services/indianStockService';

const IndianStockCard = ({ stockData, onClick, isLoading }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isLoading) {
    return (
      <div className="indian-stock-card loading">
        <div className="card-header">
          <div className="loading-skeleton symbol-skeleton"></div>
          <div className="loading-skeleton price-skeleton"></div>
        </div>
        <div className="card-body">
          <div className="loading-skeleton company-skeleton"></div>
          <div className="loading-skeleton ratio-skeleton"></div>
        </div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="indian-stock-card error">
        <div className="error-message">Failed to load stock data</div>
      </div>
    );
  }

  const isPositive = stockData.change >= 0;
  const isNeutral = stockData.change === 0;
  
  const getTrendIcon = () => {
    if (isNeutral) return <Minus size={14} />;
    return isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
  };

  const getBuyIndicatorClass = () => {
    if (stockData.buyRatio >= 70) return 'buy-high';
    if (stockData.buyRatio >= 55) return 'buy-medium';
    return 'buy-low';
  };

  const handleCardClick = () => {
    onClick && onClick(stockData);
  };

  return (
    <div 
      className={`indian-stock-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Compact View */}
      <div className="card-compact">
        <div className="card-header">
          <div className="stock-symbol">{stockData.symbol}</div>
          <div className={`stock-price ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}>
            {indianStockService.formatINR(stockData.price)}
          </div>
        </div>
        
        <div className="card-body">
          <div className="company-name">{stockData.name}</div>
          
          <div className="change-info">
            <div className={`change-value ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}>
              {getTrendIcon()}
              <span>{isPositive ? '+' : ''}{indianStockService.formatINR(stockData.change)}</span>
              <span className="change-percent">({isPositive ? '+' : ''}{stockData.changePercent.toFixed(2)}%)</span>
            </div>
          </div>

          <div className="buy-sell-info">
            <div className="quantity-row">
              <div className="buy-qty">
                <span className="label">Buy:</span>
                <span className="value">{indianStockService.formatIndianNumber(stockData.buyQuantity)}</span>
              </div>
              <div className="sell-qty">
                <span className="label">Sell:</span>
                <span className="value">{indianStockService.formatIndianNumber(stockData.sellQuantity)}</span>
              </div>
            </div>
            
            <div className={`buy-ratio-indicator ${getBuyIndicatorClass()}`}>
              <div className="ratio-bar">
                <div 
                  className="buy-fill" 
                  style={{ width: `${stockData.buyRatio}%` }}
                ></div>
              </div>
              <div className="ratio-text">
                {stockData.buyRatio}% Buy | {stockData.sellRatio}% Sell
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded View on Hover */}
      {isHovered && (
        <div className="card-expanded">
          <div className="expanded-header">
            <div className="stock-info">
              <div className="symbol-price">
                <span className="symbol">{stockData.symbol}</span>
                <span className={`price ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}>
                  {indianStockService.formatINR(stockData.price)}
                </span>
              </div>
              <div className="sector-info">
                <span className="sector">{stockData.sector}</span>
                <span className="market-cap">Cap: ₹{stockData.marketCap} Cr</span>
              </div>
            </div>
          </div>

          <div className="expanded-body">
            <div className="company-full-name">{stockData.name}</div>
            
            <div className="price-details">
              <div className="price-row">
                <span>Open: {indianStockService.formatINR(stockData.open)}</span>
                <span>High: {indianStockService.formatINR(stockData.high)}</span>
              </div>
              <div className="price-row">
                <span>Low: {indianStockService.formatINR(stockData.low)}</span>
                <span>Prev: {indianStockService.formatINR(stockData.previousClose)}</span>
              </div>
            </div>

            <div className="trading-details">
              <div className="volume-info">
                <span className="label">Volume:</span>
                <span className="value">{indianStockService.formatIndianNumber(stockData.volume)}</span>
              </div>
              
              <div className="ratios-info">
                <div className="ratio-item">
                  <span className="label">P/E:</span>
                  <span className="value">{stockData.pe}</span>
                </div>
                <div className="ratio-item">
                  <span className="label">P/B:</span>
                  <span className="value">{stockData.pbv}</span>
                </div>
                <div className="ratio-item">
                  <span className="label">Div Yield:</span>
                  <span className="value">{stockData.dividendYield}%</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="view-details-btn">
                <BarChart3 size={16} />
                View Full Details
              </button>
              <button className="info-btn">
                <Info size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndianStockCard;