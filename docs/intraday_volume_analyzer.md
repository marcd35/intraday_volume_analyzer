import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, Settings } from 'lucide-react';

const IntradayVolumeAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('simple');
  const [ticker, setTicker] = useState('AAPL');
  const [avgVolume50Day, setAvgVolume50Day] = useState(50000000);
  const [avgVolumeInput, setAvgVolumeInput] = useState('50000000');
  const [currentVolume, setCurrentVolume] = useState(0);
  const [currentVolumeInput, setCurrentVolumeInput] = useState('0');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartData, setChartData] = useState([]);
  const [granularData, setGranularData] = useState({});

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Typical intraday volume distribution (as % of daily volume)
  const volumeDistribution = [
    { time: '09:30', pct: 0.12 },
    { time: '10:00', pct: 0.20 },
    { time: '10:30', pct: 0.26 },
    { time: '11:00', pct: 0.31 },
    { time: '11:30', pct: 0.35 },
    { time: '12:00', pct: 0.39 },
    { time: '12:30', pct: 0.42 },
    { time: '13:00', pct: 0.45 },
    { time: '13:30', pct: 0.48 },
    { time: '14:00', pct: 0.51 },
    { time: '14:30', pct: 0.54 },
    { time: '15:00', pct: 0.58 },
    { time: '15:30', pct: 0.68 },
    { time: '16:00', pct: 1.00 },
  ];

  // Parse volume input with k/m/b suffixes
  const parseVolumeInput = (value) => {
    if (typeof value === 'number') return value;
    
    const str = value.toString().toLowerCase().trim();
    if (str === '') return null;
    
    const num = parseFloat(str);
    
    if (isNaN(num)) return null;
    
    if (str.includes('b')) return Math.round(num * 1000000000);
    if (str.includes('m')) return Math.round(num * 1000000);
    if (str.includes('k')) return Math.round(num * 1000);
    
    return Math.round(num);
  };

  const handleAvgVolumeChange = (value) => {
    setAvgVolumeInput(value);
    setAvgVolume50Day(parseVolumeInput(value) || 0);
  };

  const handleCurrentVolumeChange = (value) => {
    setCurrentVolumeInput(value);
    setCurrentVolume(parseVolumeInput(value) || 0);
  };

  // Generate time slots for advanced mode
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      for (let min = 0; min < 60; min += 5) {
        if (hour === 17 && min > 0) break; // Stop at 17:00
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          isPreMarket: hour < 9 || (hour === 9 && min < 30),
          isAfterMarket: hour >= 16,
          isMarketHours: (hour > 9 || (hour === 9 && min >= 30)) && hour < 16
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get expected volume for a given time
  const getExpectedVolumeAtTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const marketOpen = 9 * 60 + 30;
    const marketClose = 16 * 60;

    if (totalMinutes < marketOpen || totalMinutes > marketClose) {
      return null; // No expected volume for pre/after market
    }

    // Find the appropriate distribution point
    for (let i = 0; i < volumeDistribution.length; i++) {
      const [h, m] = volumeDistribution[i].time.split(':').map(Number);
      const distMinutes = h * 60 + m;
      
      if (distMinutes >= totalMinutes) {
        if (i === 0) return avgVolume50Day * volumeDistribution[i].pct;
        
        // Interpolate between previous and current point
        const [prevH, prevM] = volumeDistribution[i - 1].time.split(':').map(Number);
        const prevMinutes = prevH * 60 + prevM;
        const ratio = (totalMinutes - prevMinutes) / (distMinutes - prevMinutes);
        const prevPct = volumeDistribution[i - 1].pct;
        const currPct = volumeDistribution[i].pct;
        const interpolatedPct = prevPct + (currPct - prevPct) * ratio;
        
        return avgVolume50Day * interpolatedPct;
      }
    }
    
    return avgVolume50Day;
  };

  const handleGranularChange = (time, value) => {
    setGranularData(prev => ({
      ...prev,
      [time]: value
    }));
  };

  useEffect(() => {
    if (activeTab === 'simple') {
      // Simple mode chart generation
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;
      const marketOpen = 9 * 60 + 30;
      const marketClose = 16 * 60;

      const data = volumeDistribution.map(point => {
        const [h, m] = point.time.split(':').map(Number);
        const pointMinutes = h * 60 + m;
        
        const expectedVolume = avgVolume50Day * point.pct;
        
        let actualVolume = null;
        
        if (currentMinutes >= marketOpen && currentMinutes <= marketClose) {
          if (pointMinutes <= currentMinutes) {
            const currentPct = volumeDistribution.find(p => {
              const [ph, pm] = p.time.split(':').map(Number);
              const pMinutes = ph * 60 + pm;
              return pMinutes >= currentMinutes;
            })?.pct || 1.0;
            
            actualVolume = (currentVolume / currentPct) * point.pct;
          }
        }

        return {
          time: point.time,
          expected: Math.round(expectedVolume),
          actual: actualVolume ? Math.round(actualVolume) : null
        };
      });

      setChartData(data);
    } else {
      // Advanced mode chart generation
      const data = timeSlots.map(slot => {
        const expected = getExpectedVolumeAtTime(slot.time);
        const inputValue = granularData[slot.time];
        const parsedValue = inputValue ? parseVolumeInput(inputValue) : null;
        
        return {
          time: slot.time,
          expected: expected ? Math.round(expected) : null,
          actual: parsedValue,
          isPreMarket: slot.isPreMarket,
          isAfterMarket: slot.isAfterMarket
        };
      });

      // Calculate cumulative volumes where we have actual data
      let cumulativeActual = 0;
      const processedData = data.map(point => {
        if (point.actual !== null) {
          cumulativeActual = point.actual;
        }
        return {
          ...point,
          actual: cumulativeActual > 0 ? cumulativeActual : null
        };
      });

      setChartData(processedData);
    }
  }, [currentTime, avgVolume50Day, currentVolume, activeTab, granularData]);

  const getCurrentExpected = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    
    for (let i = 0; i < volumeDistribution.length; i++) {
      const [h, m] = volumeDistribution[i].time.split(':').map(Number);
      const pointMinutes = h * 60 + m;
      
      if (pointMinutes >= currentMinutes) {
        return avgVolume50Day * volumeDistribution[i].pct;
      }
    }
    return avgVolume50Day;
  };

  const getVolumeStatus = () => {
    const expected = getCurrentExpected();
    if (currentVolume === 0) return { text: 'Enter current volume', color: 'text-gray-500' };
    
    const diff = ((currentVolume - expected) / expected) * 100;
    if (diff > 20) return { text: `+${diff.toFixed(1)}% above expected`, color: 'text-green-600' };
    if (diff < -20) return { text: `${diff.toFixed(1)}% below expected`, color: 'text-red-600' };
    return { text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}% (normal)`, color: 'text-blue-600' };
  };

  const formatVolume = (vol) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  const status = getVolumeStatus();

  // Group time slots by hour
  const groupedSlots = {};
  timeSlots.forEach(slot => {
    const hour = slot.time.split(':')[0];
    if (!groupedSlots[hour]) {
      groupedSlots[hour] = [];
    }
    groupedSlots[hour].push(slot);
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Intraday Volume Analyzer</h1>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('simple')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'simple'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Simple Mode
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'advanced'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            Advanced Mode
          </button>
        </div>

        {activeTab === 'simple' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Ticker
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
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
                  onChange={(e) => handleAvgVolumeChange(e.target.value)}
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
                  onChange={(e) => handleCurrentVolumeChange(e.target.value)}
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
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Volume Status for {ticker}</p>
                  <p className={`text-2xl font-bold ${status.color}`}>
                    {status.text}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Expected at this time</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatVolume(getCurrentExpected())}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Ticker
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
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
                  onChange={(e) => handleAvgVolumeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50m or 50000000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Time
                </label>
                <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md">
                  <Clock className="w-5 h-5 mr-2 text-gray-600" />
                  <span className="font-mono text-gray-800">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Advanced Mode:</strong> Enter cumulative volume at specific times. Leave blank to use expected values. 
                Pre-market (gray) and after-hours (gray) data is for reference only.
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex gap-2">
                  {Object.keys(groupedSlots).map(hour => {
                    const hourNum = parseInt(hour);
                    const isPre = hourNum < 9 || (hourNum === 9 && groupedSlots[hour][0].isPreMarket);
                    const isAfter = hourNum >= 16;
                    const isMarket = !isPre && !isAfter;
                    
                    return (
                      <div key={hour} className="flex-shrink-0">
                        <div className={`text-center font-bold py-2 px-3 rounded-t-lg ${
                          isPre ? 'bg-gray-300 text-gray-700' :
                          isAfter ? 'bg-gray-300 text-gray-700' :
                          'bg-blue-500 text-white'
                        }`}>
                          {hourNum === 8 ? '8 AM (Pre)' :
                           hourNum === 9 ? '9 AM' :
                           hourNum === 10 ? '10 AM' :
                           hourNum === 11 ? '11 AM' :
                           hourNum === 12 ? '12 PM' :
                           hourNum === 13 ? '1 PM' :
                           hourNum === 14 ? '2 PM' :
                           hourNum === 15 ? '3 PM' :
                           hourNum === 16 ? '4 PM (After)' :
                           '5 PM (After)'}
                        </div>
                        <div className="flex flex-col gap-1 p-2 bg-white border border-gray-200 rounded-b-lg">
                          {groupedSlots[hour].map(slot => {
                            const expected = getExpectedVolumeAtTime(slot.time);
                            const placeholder = expected ? formatVolume(expected) : '';
                            
                            return (
                              <div key={slot.time} className="flex flex-col">
                                <label className="text-xs text-gray-600 mb-1">
                                  {slot.time}
                                </label>
                                <input
                                  type="text"
                                  value={granularData[slot.time] || ''}
                                  onChange={(e) => handleGranularChange(slot.time, e.target.value)}
                                  placeholder={placeholder}
                                  className={`w-24 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                    slot.isPreMarket || slot.isAfterMarket
                                      ? 'bg-gray-100 border-gray-300 text-gray-600'
                                      : 'bg-white border-gray-300'
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
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Volume Progression Throughout Trading Day</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              label={{ value: 'Time (ET)', position: 'insideBottom', offset: -5 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={activeTab === 'advanced' ? 11 : 0}
            />
            <YAxis 
              tickFormatter={formatVolume}
              label={{ value: 'Volume', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => value ? formatVolume(value) : 'N/A'}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="expected" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Expected Volume (50-day avg)"
              dot={false}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#10b981" 
              strokeWidth={2}
              name={activeTab === 'simple' ? "Actual Volume (projected)" : "Actual Volume"}
              dot={false}
              strokeDasharray={activeTab === 'simple' ? "5 5" : "0"}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-4 text-sm text-gray-600">
          {activeTab === 'simple' ? (
            <>
              <p className="mb-2"><strong>Note:</strong> The volume distribution is based on typical market patterns where volume is highest at market open and close.</p>
              <p>The "Actual Volume" line shows the projected full-day volume based on current trading pace.</p>
            </>
          ) : (
            <>
              <p className="mb-2"><strong>Advanced Mode:</strong> Enter cumulative volume values at any time interval to see how actual trading compares to expected patterns.</p>
              <p>Gray columns represent pre-market (8:00-9:30 AM) and after-hours (4:00-5:00 PM) trading periods.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntradayVolumeAnalyzer;