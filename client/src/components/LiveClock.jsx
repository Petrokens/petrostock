import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Config from '../config';

const LiveClock = ({ timezone = 'America/New_York', label = 'Market Time' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check if market is open (simplified - weekdays 9:30 AM to 4:00 PM ET)
      const marketTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      const day = marketTime.getDay();
      const hour = marketTime.getHours();
      const minute = marketTime.getMinutes();
      const timeInMinutes = hour * 60 + minute;
      
      const marketOpenTime = 9 * 60 + 30; // 9:30 AM
      const marketCloseTime = 16 * 60; // 4:00 PM
      
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = timeInMinutes >= marketOpenTime && timeInMinutes < marketCloseTime;
      
      setIsMarketOpen(isWeekday && isMarketHours);
    };

    updateClock(); // Initial update
    const interval = setInterval(updateClock, Config.CLOCK_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [timezone]);

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="live-clock">
      <div className="clock-header">
        <Clock size={18} />
        <span className="clock-label">{label}</span>
        <span className={`market-status ${isMarketOpen ? 'open' : 'closed'}`}>
          {isMarketOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <div className="clock-time">
        {formatTime(currentTime)}
      </div>
      <div className="clock-date">
        {formatDate(currentTime)}
      </div>
    </div>
  );
};

export default LiveClock;