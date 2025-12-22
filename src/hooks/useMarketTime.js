import { useState, useEffect } from 'react';

export const useMarketTime = initialTime => {
  const [currentTime, setCurrentTime] = useState(initialTime || new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return currentTime;
};
