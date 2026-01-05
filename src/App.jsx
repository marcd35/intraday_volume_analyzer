import React, { useState } from 'react';
import { useMarketTime } from './hooks/useMarketTime';
import { useVolumeCalculations } from './hooks/useVolumeCalculations';
import { parseVolumeInput } from './utils/formatters';
import SimpleModeControls from './components/SimpleModeControls';
import AdvancedModeControls from './components/AdvancedModeControls';
import VolumeChart from './components/VolumeChart';
import VolumeStatus from './components/VolumeStatus';

function App() {
  const [activeTab, setActiveTab] = useState('simple');
  const [ticker, setTicker] = useState('AAPL');
  const [avgVolumeInput, setAvgVolumeInput] = useState('50m');
  const [currentVolumeInput, setCurrentVolumeInput] = useState('');
  const [newDailyVolumeInput, setNewDailyVolumeInput] = useState('');
  const [granularData, setGranularData] = useState({});

  const currentTime = useMarketTime();
  const avgVolume50Day = parseVolumeInput(avgVolumeInput) || 0;
  const currentVolume = parseVolumeInput(currentVolumeInput) || 0;

  const {
    chartData,
    getCurrentExpected,
    timeSlots,
    getExpectedVolumeAtTime,
    getIndividualVolumeAtTime,
  } = useVolumeCalculations({
    activeTab,
    ticker,
    avgVolume50Day,
    currentVolume,
    currentTime,
    granularData,
    newDailyVolumeInput,
  });

  const handleAvgVolumeChange = value => {
    setAvgVolumeInput(value);
  };

  const handleCurrentVolumeChange = value => {
    setCurrentVolumeInput(value);
  };

  const handleNewDailyVolumeChange = value => {
    setNewDailyVolumeInput(value);
  };

  const handleGranularChange = (time, value) => {
    setGranularData(prev => ({
      ...prev,
      [time]: value,
    }));
  };

  const expectedVolume = getCurrentExpected();
  const volumeStatus =
    currentVolume > 0 && expectedVolume > 0
      ? ((currentVolume / expectedVolume) * 100).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Intraday Volume Analyzer
          </h1>
          <p className="text-gray-600">
            Track and analyze intraday volume patterns against historical
            averages
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('simple')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'simple'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Simple Mode
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'advanced'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Advanced Mode
            </button>
          </div>

          {activeTab === 'simple' ? (
            <SimpleModeControls
              ticker={ticker}
              setTicker={setTicker}
              avgVolumeInput={avgVolumeInput}
              handleAvgVolumeChange={handleAvgVolumeChange}
              currentVolumeInput={currentVolumeInput}
              handleCurrentVolumeChange={handleCurrentVolumeChange}
              currentTime={currentTime}
            />
          ) : (
            <AdvancedModeControls
              ticker={ticker}
              setTicker={setTicker}
              avgVolumeInput={avgVolumeInput}
              handleAvgVolumeChange={handleAvgVolumeChange}
              currentTime={currentTime}
              timeSlots={timeSlots}
              granularData={granularData}
              handleGranularChange={handleGranularChange}
              getExpectedVolumeAtTime={getExpectedVolumeAtTime}
              getIndividualVolumeAtTime={getIndividualVolumeAtTime}
              newDailyVolumeInput={newDailyVolumeInput}
              handleNewDailyVolumeChange={handleNewDailyVolumeChange}
            />
          )}
        </div>

        {currentVolume > 0 && (
          <VolumeStatus
            currentVolume={currentVolume}
            expectedVolume={expectedVolume}
            ticker={ticker}
            currentTime={currentTime}
          />
        )}

        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-6">
            <VolumeChart
              data={chartData}
              ticker={ticker}
              activeTab={activeTab}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
