export const VOLUME_DISTRIBUTION = [
  { time: '09:30', pct: 0.12 },
  { time: '10:00', pct: 0.2 },
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
  { time: '16:00', pct: 1.0 },
];

// Premarket volume distribution (8:00-9:25 AM)
// Premarket typically accounts for ~3-4% of daily volume
// Volume ramps up as market open approaches
// These are CUMULATIVE percentages of the expected 50-day avg volume
export const PREMARKET_DISTRIBUTION = {
  '08:00': 0.001, // 0.1% - very low early premarket
  '08:05': 0.0015,
  '08:10': 0.002,
  '08:15': 0.0025,
  '08:20': 0.003,
  '08:25': 0.0035,
  '08:30': 0.005, // 0.5% - picks up at 8:30
  '08:35': 0.006,
  '08:40': 0.007,
  '08:45': 0.008,
  '08:50': 0.009,
  '08:55': 0.01,
  '09:00': 0.012, // 1.2% - more activity as open approaches
  '09:05': 0.014,
  '09:10': 0.016,
  '09:15': 0.018,
  '09:20': 0.02,
  '09:25': 0.022, // ~2.2% cumulative by 9:25
};

export const MARKET_OPEN_MINUTES = 9 * 60 + 30; // 9:30 AM
export const MARKET_CLOSE_MINUTES = 16 * 60; // 4:00 PM
export const TITLE = 'Intraday Volume Analyzer';
