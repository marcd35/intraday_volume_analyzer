import React from 'react';
import { Clock } from 'lucide-react';
import { formatVolume } from '../utils/formatters';

const AdvancedModeControls = ({
  ticker,
  setTicker,
  avgVolumeInput,
  handleAvgVolumeChange,
  currentTime,
  timeSlots,
  granularData,
  handleGranularChange,
  getExpectedVolumeAtTime,
  getIndividualVolumeAtTime,
  newDailyVolumeInput,
  handleNewDailyVolumeChange,
}) => {
  // Determine market session
  const getMarketSession = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes >= 4 * 60 && totalMinutes < 9 * 60 + 30) {
      return {
        text: 'PRE-MARKET',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
      };
    } else if (totalMinutes >= 9 * 60 + 30 && totalMinutes < 16 * 60) {
      return {
        text: 'MARKET OPEN',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      };
    } else {
      return {
        text: 'AFTERMARKET',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      };
    }
  };

  const marketSession = getMarketSession();
  // Group time slots by hour for display
  const groupedSlots = {};
  timeSlots.forEach(slot => {
    const hour = slot.time.split(':')[0];
    if (!groupedSlots[hour]) {
      groupedSlots[hour] = [];
    }
    groupedSlots[hour].push(slot);
  });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Ticker
          </label>
          <input
            type="text"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="AAPL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            50-Day Avg Volume
          </label>
          <input
            type="text"
            value={avgVolumeInput}
            onChange={e => handleAvgVolumeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="50m or 50000000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Daily Volume
          </label>
          <input
            type="text"
            value={newDailyVolumeInput}
            onChange={e => handleNewDailyVolumeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Projected daily volume"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Time
          </label>
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-md ${marketSession.bgColor}`}
          >
            <div className="flex items-center">
              <Clock className={`w-5 h-5 mr-2 ${marketSession.color}`} />
              <span
                className={`font-mono font-semibold ${marketSession.color}`}
              >
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <span className={`text-xs font-bold ${marketSession.color}`}>
              {marketSession.text}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Advanced Mode:</strong> Enter the <strong>individual volume</strong> for each
          5-minute interval (not cumulative). The graph will automatically project the full-day
          volume based on your inputs and smooth the projection. Leave blank to use expected values.
          Pre-market (gray) and after-hours (gray) data is for reference only.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-2">
            {Object.keys(groupedSlots)
              .filter(hour => parseInt(hour) !== 17) // Remove 5pm column
              .sort((a, b) => {
                // Sort to put 8 and 9 first, then the rest in order
                const hourA = parseInt(a);
                const hourB = parseInt(b);
                if (hourA === 8) return -1;
                if (hourB === 8) return 1;
                if (hourA === 9) return -1;
                if (hourB === 9) return 1;
                return hourA - hourB;
              })
              .map(hour => {
                const hourNum = parseInt(hour);
                const isPre =
                  hourNum < 9 ||
                  (hourNum === 9 && groupedSlots[hour][0].isPreMarket);
                const isAfter = hourNum >= 16;

                return (
                  <div key={hour} className="flex-shrink-0">
                    <div
                      className={`text-center font-bold py-2 px-3 rounded-t-lg ${
                        isPre
                          ? 'bg-gray-300 text-gray-700'
                          : isAfter
                            ? 'bg-gray-300 text-gray-700'
                            : 'bg-blue-500 text-white'
                      }`}
                    >
                      {hourNum === 8
                        ? '8 AM (Pre)'
                        : hourNum === 9
                          ? '9 AM'
                          : hourNum === 10
                            ? '10 AM'
                            : hourNum === 11
                              ? '11 AM'
                              : hourNum === 12
                                ? '12 PM'
                                : hourNum === 13
                                  ? '1 PM'
                                  : hourNum === 14
                                    ? '2 PM'
                                    : hourNum === 15
                                      ? '3 PM'
                                      : '4 PM (After)'}
                    </div>
                    <div className="flex flex-col gap-1 p-2 bg-white border border-gray-200 rounded-b-lg">
                      {groupedSlots[hour].map(slot => {
                        const expected = getIndividualVolumeAtTime(slot.time);
                        const placeholder = expected
                          ? formatVolume(expected)
                          : '';

                        return (
                          <div key={slot.time} className="flex flex-col">
                            <label className="text-xs text-gray-600 mb-1">
                              {slot.time}
                            </label>
                            <input
                              type="text"
                              value={granularData[slot.time] || ''}
                              onChange={e =>
                                handleGranularChange(slot.time, e.target.value)
                              }
                              placeholder={placeholder}
                              className={`w-24 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                slot.isPreMarket || slot.isAfterMarket
                                  ? 'bg-gray-100 border-gray-300 text-gray-600'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedModeControls;
