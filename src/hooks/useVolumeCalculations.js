import { useState, useEffect, useMemo } from 'react';
import {
  VOLUME_DISTRIBUTION,
  MARKET_OPEN_MINUTES,
  MARKET_CLOSE_MINUTES,
} from '../utils/constants';
import { parseVolumeInput, generateTimeSlots } from '../utils/formatters';

export const useVolumeCalculations = ({
  activeTab,
  ticker,
  avgVolume50Day,
  currentVolume,
  currentTime,
  granularData,
}) => {
  const [chartData, setChartData] = useState([]);
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Helper to get expected cumulative volume at a specific time
  const getExpectedVolumeAtTime = timeStr => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    if (
      totalMinutes < MARKET_OPEN_MINUTES ||
      totalMinutes > MARKET_CLOSE_MINUTES
    ) {
      return null; // No expected volume for pre/after market
    }

    // Find the appropriate distribution point
    for (let i = 0; i < VOLUME_DISTRIBUTION.length; i++) {
      const [h, m] = VOLUME_DISTRIBUTION[i].time.split(':').map(Number);
      const distMinutes = h * 60 + m;

      if (distMinutes >= totalMinutes) {
        if (i === 0) return avgVolume50Day * VOLUME_DISTRIBUTION[i].pct;

        // Interpolate between previous and current point
        const [prevH, prevM] = VOLUME_DISTRIBUTION[i - 1].time
          .split(':')
          .map(Number);
        const prevMinutes = prevH * 60 + prevM;
        const ratio =
          (totalMinutes - prevMinutes) / (distMinutes - prevMinutes);
        const prevPct = VOLUME_DISTRIBUTION[i - 1].pct;
        const currPct = VOLUME_DISTRIBUTION[i].pct;
        const interpolatedPct = prevPct + (currPct - prevPct) * ratio;

        return avgVolume50Day * interpolatedPct;
      }
    }

    return avgVolume50Day;
  };

  // Helper to get individual volume for a specific 5-minute interval
  const getIndividualVolumeAtTime = timeStr => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    if (
      totalMinutes < MARKET_OPEN_MINUTES ||
      totalMinutes > MARKET_CLOSE_MINUTES
    ) {
      return null; // No expected volume for pre/after market
    }

    // Calculate cumulative volume at this time
    const cumulativeAtTime = getExpectedVolumeAtTime(timeStr);
    if (cumulativeAtTime === null) return null;

    // Calculate cumulative volume 5 minutes earlier
    const prevMinutes = totalMinutes - 5;
    const prevHours = Math.floor(prevMinutes / 60);
    const prevMins = prevMinutes % 60;
    const prevTimeStr = `${prevHours.toString().padStart(2, '0')}:${prevMins.toString().padStart(2, '0')}`;

    // If this is the first interval (9:30), return the full cumulative
    if (prevMinutes < MARKET_OPEN_MINUTES) {
      return cumulativeAtTime;
    }

    const cumulativePrev = getExpectedVolumeAtTime(prevTimeStr);
    if (cumulativePrev === null) return cumulativeAtTime;

    // Individual volume is the difference
    return cumulativeAtTime - cumulativePrev;
  };

  const getCurrentExpected = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    for (let i = 0; i < VOLUME_DISTRIBUTION.length; i++) {
      const [h, m] = VOLUME_DISTRIBUTION[i].time.split(':').map(Number);
      const pointMinutes = h * 60 + m;

      if (pointMinutes >= currentMinutes) {
        return avgVolume50Day * VOLUME_DISTRIBUTION[i].pct;
      }
    }
    return avgVolume50Day;
  };

  useEffect(() => {
    if (activeTab === 'simple') {
      // Simple mode chart generation
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;

      const data = VOLUME_DISTRIBUTION.map(point => {
        const [h, m] = point.time.split(':').map(Number);
        const pointMinutes = h * 60 + m;

        const expectedVolume = avgVolume50Day * point.pct;

        let actualVolume = null;

        if (
          currentMinutes >= MARKET_OPEN_MINUTES &&
          currentMinutes <= MARKET_CLOSE_MINUTES
        ) {
          if (pointMinutes <= currentMinutes) {
            const currentPct =
              VOLUME_DISTRIBUTION.find(p => {
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
          actual: actualVolume ? Math.round(actualVolume) : null,
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
          isAfterMarket: slot.isAfterMarket,
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
          actual: cumulativeActual > 0 ? cumulativeActual : null,
        };
      });

      setChartData(processedData);
    }
  }, [
    currentTime,
    avgVolume50Day,
    currentVolume,
    activeTab,
    granularData,
    ticker,
  ]);

  return {
    chartData,
    getCurrentExpected,
    timeSlots,
    getExpectedVolumeAtTime,
    getIndividualVolumeAtTime,
  };
};
