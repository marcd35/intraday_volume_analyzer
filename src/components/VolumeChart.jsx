import React from 'react';
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
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Volume Progression Throughout Trading Day
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
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
            formatter={value => (value ? formatVolume(value) : 'N/A')}
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
            name={
              activeTab === 'simple'
                ? 'Actual Volume (projected)'
                : 'Actual Volume'
            }
            dot={false}
            strokeDasharray={activeTab === 'simple' ? '5 5' : '0'}
            connectNulls
          />
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
              Gray columns represent pre-market (8:00-9:30 AM) and after-hours
              (4:00-5:00 PM) trading periods.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VolumeChart;
