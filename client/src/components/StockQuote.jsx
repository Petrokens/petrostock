import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StockQuote = ({ symbol, data, isLoading }) => {
  const [animatePrice, setAnimatePrice] = useState(false);

  useEffect(() => {
    if (data && data.timestamp) {
      setAnimatePrice(true);
      const timer = setTimeout(() => setAnimatePrice(false), 500);
      return () => clearTimeout(timer);
    }
  }, [data?.price, data?.timestamp]);

  if (isLoading) {
    return (
      <div className="stock-quote loading">
        <div className="quote-symbol">{symbol}</div>
        <div className="loading-skeleton price-skeleton"></div>
        <div className="loading-skeleton change-skeleton"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="stock-quote error">
        <div className="quote-symbol">{symbol}</div>
        <div className="error-message">Failed to load</div>
      </div>
    );
  }

  const isPositive = data.change >= 0;
  const isNeutral = data.change === 0;
  
  const getTrendIcon = () => {
    if (isNeutral) return <Minus size={16} />;
    return isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatNumber = (num) => {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <div className="stock-quote">
      <div className="quote-header">
        <div className="quote-symbol">{data.symbol}</div>
        <div className="quote-company">{data.symbol} Inc.</div>
      </div>
      
      <div className="quote-price-section">
        <div className={`quote-price ${animatePrice ? 'animate' : ''}`}>
          {formatPrice(data.price)}
        </div>
        
        <div className={`quote-change ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}>
          {getTrendIcon()}
          <span className="change-value">
            {isPositive ? '+' : ''}{formatPrice(data.change)}
          </span>
          <span className="change-percent">
            ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="quote-stats">
        <div className="stat-row">
          <span className="stat-label">Volume:</span>
          <span className="stat-value">{formatNumber(data.volume)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">High:</span>
          <span className="stat-value">{formatPrice(data.high)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Low:</span>
          <span className="stat-value">{formatPrice(data.low)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Market Cap:</span>
          <span className="stat-value">{data.marketCap}</span>
        </div>
      </div>
    </div>
  );
};

export default StockQuote;