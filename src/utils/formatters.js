export const parseVolumeInput = value => {
  if (typeof value === 'number') return value;

  const str = value.toString().toLowerCase().trim();
  if (str === '') return null;

  // Remove commas if present
  const cleanStr = str.replace(/,/g, '');
  const num = parseFloat(cleanStr);

  if (isNaN(num)) return null;

  if (cleanStr.includes('b')) return Math.round(num * 1000000000);
  if (cleanStr.includes('m')) return Math.round(num * 1000000);
  if (cleanStr.includes('k')) return Math.round(num * 1000);

  return Math.round(num);
};

export const formatVolume = vol => {
  if (vol === null || vol === undefined) return 'N/A';
  if (vol >= 1000000000) return `${(vol / 1000000000).toFixed(2)}B`;
  if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
  return vol.toString();
};

export const getMarketStatus = currentTime => {
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  
  // NYSE trading hours: 9:30 AM - 4:00 PM ET
  const isMarketOpen = (hour > 9 || (hour === 9 && minute >= 30)) && hour < 16;
  const isPreMarket = hour < 9 || (hour === 9 && minute < 30);
  const isAfterMarket = hour >= 16;
  
  return {
    isMarketOpen,
    isPreMarket,
    isAfterMarket,
    status: isMarketOpen ? 'open' : isPreMarket ? 'pre-market' : 'after-hours'
  };
};

export const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 16; hour++) {
    for (let min = 0; min < 60; min += 5) {
      if (hour === 16 && min > 55) break; // Stop after 16:55
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push({
        time: timeStr,
        isPreMarket: hour < 9 || (hour === 9 && min < 30),
        isAfterMarket: hour >= 16,
        isMarketHours: (hour > 9 || (hour === 9 && min >= 30)) && hour < 16,
      });
    }
  }
  return slots;
};
