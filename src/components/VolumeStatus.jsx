import React from 'react';
import { formatVolume } from '../utils/formatters';

const VolumeStatus = ({ currentVolume, expectedVolume, ticker }) => {
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

  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Volume Status for {ticker}</p>
          <p className={`text-2xl font-bold ${status.color}`}>{status.text}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Expected at this time</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatVolume(expectedVolume)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VolumeStatus;
