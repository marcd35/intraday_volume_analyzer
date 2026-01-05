import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatVolume } from '../utils/formatters';

const VolumeChart = ({ data, activeTab }) => {
  // Transform data to separate premarket and market values for different line styles
  const transformedData = useMemo(() => {
    if (activeTab !== 'advanced') return data;
    
    return data.map((point, index) => {
      const isPreMarket = point.isPreMarket;
      // Check if this is the first market hours point (9:30)
      const prevPoint = index > 0 ? data[index - 1] : null;
      const isFirstMarket = !isPreMarket && prevPoint?.isPreMarket;
      // Check if this is the last premarket point (9:25)
      const nextPoint = data[index + 1];
      const isLastPremarket = isPreMarket && nextPoint && !nextPoint.isPreMarket;
      
      return {
        ...point,
        // Premarket values - show for premarket times AND the first market point (to connect)
        expectedPremarket: isPreMarket || isFirstMarket ? point.expected : null,
        actualPremarket: isPreMarket || isFirstMarket ? point.actual : null,
        // Market hours values - show for market hours AND the last premarket point (to connect)
        expectedMarket: !isPreMarket || isLastPremarket ? point.expected : null,
        actualMarket: !isPreMarket || isLastPremarket ? point.actual : null,
      };
    });
  }, [data, activeTab]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Volume Progression Throughout Trading Day
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={activeTab === 'advanced' ? transformedData : data}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} />
          <XAxis
            dataKey="time"
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 11 }}
            tickLine={true}
            interval={0}
            tickFormatter={(value, index) => {
              // Show labels only at 30-minute intervals in advanced mode
              if (activeTab === 'advanced') {
                const timeParts = value.split(':');
                const minutes = parseInt(timeParts[1]);
                return minutes % 30 === 0 ? value : '';
              }
              return value;
            }}
          />
          <YAxis
            tickFormatter={formatVolume}
          />
          <Tooltip
            formatter={value => (value ? formatVolume(value) : 'N/A')}
            labelStyle={{ color: '#000' }}
          />
          <Legend />
          {activeTab === 'advanced' ? (
            <>
              {/* Premarket Expected - dotted blue line */}
              <Line
                type="monotone"
                dataKey="expectedPremarket"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Expected (Pre-market)"
                dot={false}
                connectNulls
              />
              {/* Market Hours Expected - solid blue line */}
              <Line
                type="monotone"
                dataKey="expectedMarket"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Expected Volume (50-day avg)"
                dot={false}
                connectNulls
              />
              {/* Premarket Actual - dotted green line */}
              <Line
                type="monotone"
                dataKey="actualPremarket"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Actual (Pre-market)"
                dot={false}
                connectNulls
              />
              {/* Market Hours Actual - solid green line */}
              <Line
                type="monotone"
                dataKey="actualMarket"
                stroke="#10b981"
                strokeWidth={2}
                name="Actual Volume"
                dot={false}
                connectNulls
              />
            </>
          ) : (
            <>
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
                name="Actual Volume (projected)"
                dot={false}
                strokeDasharray="5 5"
                connectNulls
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-gray-600">
        {activeTab === 'simple' ? (
          <>
            <p className="mb-2">
              <strong>Note:</strong> The volume distribution is based on typical
              market patterns where volume is highest at market open and close.
            </p>
            <p>
              The &quot;Actual Volume&quot; line shows the projected full-day
              volume based on current trading pace.
            </p>
          </>
        ) : (
          <>
            <p className="mb-2">
              <strong>Advanced Mode:</strong> Enter cumulative volume values at
              any time interval to see how actual trading compares to expected
              patterns.
            </p>
            <p>
              <strong>Dotted lines</strong> represent pre-market (8:00-9:25 AM) trading.{' '}
              <strong>Solid lines</strong> represent regular market hours (9:30 AM - 4:00 PM).
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VolumeChart;
