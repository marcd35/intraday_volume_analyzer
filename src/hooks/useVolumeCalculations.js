import { useState, useEffect, useMemo } from 'react';
import {
  VOLUME_DISTRIBUTION,
  MARKET_OPEN_MINUTES,
  MARKET_CLOSE_MINUTES,
} from '../utils/constants';
import { parseVolumeInput, generateTimeSlots } from '../utils/formatters';

// Helper function to calculate volume projection based on user inputs
const calculateVolumeProjection = (data, avgVolume50Day, newDailyVolumeInput) => {
  const userInputs = data.filter(point => point.userInput !== null && !point.isPreMarket && !point.isAfterMarket);
  
  if (userInputs.length === 0) {
    // No user inputs - return null to indicate use expected values
    return null;
  }
  
  // Calculate cumulative actual and expected volumes up to last input
  let cumulativeActual = 0;
  let cumulativeExpected = 0;
  let lastInputTime = null;
  
  for (const point of data) {
    if (point.userInput !== null && !point.isPreMarket && !point.isAfterMarket) {
      cumulativeActual += point.userInput;
      cumulativeExpected = point.expected || 0;
      lastInputTime = point.time;
    } else if (point.userInput === null && !point.isPreMarket && !point.isAfterMarket && cumulativeExpected === 0) {
      // Before any user input, accumulate expected individual volumes
      cumulativeExpected += point.expectedIndividual || 0;
    }
  }
  
  if (cumulativeExpected <= 0) {
    return null;
  }
  
  // Check if manual daily volume is provided
  const manualDailyVolume = newDailyVolumeInput ? parseVolumeInput(newDailyVolumeInput) : null;
  
  // Calculate volume ratio and projected daily volume
  const volumeRatio = cumulativeActual / cumulativeExpected;
  const autoProjectedDailyVolume = avgVolume50Day * volumeRatio;
  
  // Use manual volume if provided, otherwise use auto-calculated
  const projectedDailyVolume = manualDailyVolume || autoProjectedDailyVolume;
  
  return {
    projectedDailyVolume,
    volumeRatio,
    lastInputTime,
    cumulativeActual,
    cumulativeExpected,
    manualDailyVolume: !!manualDailyVolume
  };
};

// Helper function for smooth interpolation between points
const smoothInterpolation = (data, projection, newDailyVolumeInput, avgVolume50Day) => {
  if (!projection) {
    // No projection needed - return data with expected values
    return data.map(point => ({
      ...point,
      actual: point.expected
    }));
  }
  
  const result = [];
  let cumulativeActual = 0;
  let lastUserInputIndex = -1;
  
  // First pass: build cumulative actual up to last user input
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    
    if (point.userInput !== null && !point.isPreMarket && !point.isAfterMarket) {
      cumulativeActual += point.userInput;
      lastUserInputIndex = i;
    } else if (point.userInput === null && !point.isPreMarket && !point.isAfterMarket && lastUserInputIndex === -1) {
      // Before any user input, use expected individual volumes
      cumulativeActual += point.expectedIndividual || 0;
    }
    
    result.push({
      ...point,
      cumulativeActual: cumulativeActual
    });
  }
  
  // Second pass: apply smoothing and projection
  const finalResult = [];
  for (let i = 0; i < result.length; i++) {
    const point = result[i];
    let actualValue = null;
    
    if (point.isPreMarket || point.isAfterMarket) {
      actualValue = null;
    } else if (i <= lastUserInputIndex) {
      // Up to and including last user input - use actual cumulative
      actualValue = Math.round(point.cumulativeActual);
    } else {
      // After last user input - apply smooth projection
      const expectedPctAtThisTime = point.expected ? point.expected / avgVolume50Day : 0;
      const projectedValue = projection.projectedDailyVolume * expectedPctAtThisTime;
      
      // Apply smoothing factor based on distance from last input
      const distanceFromLastInput = i - lastUserInputIndex;
      const smoothingFactor = Math.min(distanceFromLastInput / 12, 1); // Smooth over ~1 hour
      
      // Blend between last actual value and projected value
      const lastActualValue = result[lastUserInputIndex]?.cumulativeActual || 0;
      actualValue = Math.round(lastActualValue + (projectedValue - lastActualValue) * smoothingFactor);
    }
    
    finalResult.push({
      time: point.time,
      expected: point.expected,
      actual: actualValue,
      isPreMarket: point.isPreMarket,
      isAfterMarket: point.isAfterMarket,
    });
  }
  
  return finalResult;
};

export const useVolumeCalculations = ({
  activeTab,
  ticker,
  avgVolume50Day,
  currentVolume,
  currentTime,
  granularData,
  newDailyVolumeInput,
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

        // Calculate actual volume if we have currentVolume
        if (currentVolume > 0) {
          // Determine the current percentage based on time
          let currentPct = 1.0; // Default to 100% (after market close)
          
          if (currentMinutes >= MARKET_OPEN_MINUTES && currentMinutes <= MARKET_CLOSE_MINUTES) {
            // During market hours, find the appropriate percentage
            currentPct =
              VOLUME_DISTRIBUTION.find(p => {
                const [ph, pm] = p.time.split(':').map(Number);
                const pMinutes = ph * 60 + pm;
                return pMinutes >= currentMinutes;
              })?.pct || 1.0;
          } else if (currentMinutes < MARKET_OPEN_MINUTES) {
            // Before market open, use the first percentage point
            currentPct = VOLUME_DISTRIBUTION[0].pct;
          }
          
          // Project the volume for this point
          actualVolume = (currentVolume / currentPct) * point.pct;
        }

        return {
          time: point.time,
          expected: Math.round(expectedVolume),
          actual: actualVolume ? Math.round(actualVolume) : null,
        };
      });

      setChartData(data);
    } else {
      // Advanced mode chart generation with smooth interpolation
      // Step 1: Build data structure with expected and user input values
      const data = timeSlots.map(slot => {
        const expectedCumulative = getExpectedVolumeAtTime(slot.time);
        const expectedIndividual = getIndividualVolumeAtTime(slot.time);
        const inputValue = granularData[slot.time];
        const parsedValue = inputValue ? parseVolumeInput(inputValue) : null;

        return {
          time: slot.time,
          expected: expectedCumulative ? Math.round(expectedCumulative) : null,
          expectedIndividual: expectedIndividual ? Math.round(expectedIndividual) : null,
          userInput: parsedValue,
          isPreMarket: slot.isPreMarket,
          isAfterMarket: slot.isAfterMarket,
        };
      });

      // Step 2: Calculate volume projection and apply smooth interpolation
      const projection = calculateVolumeProjection(data, avgVolume50Day, newDailyVolumeInput);
      const processedData = smoothInterpolation(data, projection, newDailyVolumeInput, avgVolume50Day);
      
      setChartData(processedData);
    }
  }, [
    currentTime,
    avgVolume50Day,
    currentVolume,
    activeTab,
    granularData,
    timeSlots,
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
