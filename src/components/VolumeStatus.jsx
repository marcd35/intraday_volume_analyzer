import React from 'react';
import { formatVolume, getMarketStatus } from '../utils/formatters';

const VolumeStatus = ({ currentVolume, expectedVolume, ticker, currentTime }) => {
  const getVolumeStatus = () => {
    if (currentVolume === 0)
      return { text: 'Enter current volume', color: 'text-gray-500' };

    const diff = ((currentVolume - expectedVolume) / expectedVolume) * 100;
    if (diff > 20)
      return {
        text: `+${diff.toFixed(1)}% above expected`,
        color: 'text-green-600',
      };
    if (diff < -20)
      return {
        text: `${diff.toFixed(1)}% below expected`,
        color: 'text-red-600',
      };
    return {
      text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}% (normal)`,
      color: 'text-blue-600',
    };
  };

  const status = getVolumeStatus();
  const marketStatus = getMarketStatus(currentTime);

  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${marketStatus.isMarketOpen ? 'bg-green-500' : marketStatus.isPreMarket ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <div>
            <p className="text-sm text-gray-600">Market Status</p>
            <p className="text-lg font-semibold capitalize">{marketStatus.status}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600">Volume Status for {ticker}</p>
          <p className={`text-2xl font-bold ${status.color}`}>{status.text}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600">Expected at this time</p>
        <p className="text-2xl font-bold text-gray-800">
          {formatVolume(expectedVolume)}
        </p>
      </div>
    </div>
  );
};

export default VolumeStatus;
