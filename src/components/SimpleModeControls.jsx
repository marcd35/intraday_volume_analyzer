import React from 'react';
import { Clock } from 'lucide-react';

const SimpleModeControls = ({
  ticker,
  setTicker,
  avgVolumeInput,
  handleAvgVolumeChange,
  currentVolumeInput,
  handleCurrentVolumeChange,
  currentTime,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          Current Volume
        </label>
        <input
          type="text"
          value={currentVolumeInput}
          onChange={e => handleCurrentVolumeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="2.13m or 65.2k"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Time
        </label>
        <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md">
          <Clock className="w-5 h-5 mr-2 text-gray-600" />
          <span className="font-mono text-gray-800">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimpleModeControls;
