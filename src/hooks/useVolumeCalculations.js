import { useState, useEffect, useMemo } from 'react';
import {
  VOLUME_DISTRIBUTION,
  PREMARKET_DISTRIBUTION,
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

          if (
            currentMinutes >= MARKET_OPEN_MINUTES &&
            currentMinutes <= MARKET_CLOSE_MINUTES
          ) {
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
      // Advanced mode chart generation
      // Step 1: Parse the current daily volume (cumulative volume at current time)
      const currentDailyVolume = newDailyVolumeInput
        ? parseVolumeInput(newDailyVolumeInput)
        : 0;

      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;

      // Step 2: Find the current time's expected percentage for projection
      let currentExpectedPct = 1.0;
      if (
        currentMinutes >= MARKET_OPEN_MINUTES &&
        currentMinutes <= MARKET_CLOSE_MINUTES
      ) {
        for (let i = 0; i < VOLUME_DISTRIBUTION.length; i++) {
          const [h, m] = VOLUME_DISTRIBUTION[i].time.split(':').map(Number);
          const pointMinutes = h * 60 + m;

          if (pointMinutes >= currentMinutes) {
            if (i === 0) {
              currentExpectedPct = VOLUME_DISTRIBUTION[i].pct;
            } else {
              const [prevH, prevM] = VOLUME_DISTRIBUTION[i - 1].time
                .split(':')
                .map(Number);
              const prevMinutes = prevH * 60 + prevM;
              const ratio =
                (currentMinutes - prevMinutes) / (pointMinutes - prevMinutes);
              currentExpectedPct =
                VOLUME_DISTRIBUTION[i - 1].pct +
                (VOLUME_DISTRIBUTION[i].pct - VOLUME_DISTRIBUTION[i - 1].pct) *
                  ratio;
            }
            break;
          }
        }
      } else if (currentMinutes < MARKET_OPEN_MINUTES) {
        currentExpectedPct = VOLUME_DISTRIBUTION[0].pct;
      }

      // Step 3: Calculate projected end-of-day volume (baseline)
      const baselineProjectedDaily =
        currentExpectedPct > 0 ? currentDailyVolume / currentExpectedPct : 0;

      // Step 4: Build individual volumes for each time slot
      // These are the 5-minute bar volumes that when summed give cumulative
      const individualVolumes = [];
      let prevExpectedCumulative = 0;

      for (const slot of timeSlots) {
        const [slotH, slotM] = slot.time.split(':').map(Number);
        const slotMinutes = slotH * 60 + slotM;

        if (slot.isPreMarket) {
          // Calculate premarket expected volume using PREMARKET_DISTRIBUTION
          const premarketPct = PREMARKET_DISTRIBUTION[slot.time];
          if (premarketPct) {
            const expectedCumulative = avgVolume50Day * premarketPct;
            // Calculate individual volume for this 5-min bar
            const times = Object.keys(PREMARKET_DISTRIBUTION).sort();
            const idx = times.indexOf(slot.time);
            const prevPct =
              idx > 0 ? PREMARKET_DISTRIBUTION[times[idx - 1]] : 0;
            const expectedIndividual =
              avgVolume50Day * (premarketPct - prevPct);

            // For premarket projected: use same ratio as market hours baseline
            let projectedIndividual = 0;
            if (avgVolume50Day > 0 && expectedIndividual > 0) {
              projectedIndividual =
                (baselineProjectedDaily / avgVolume50Day) * expectedIndividual;
            }

            // Check for user override
            const granularValue = granularData[slot.time];
            const actualIndividual = granularValue
              ? parseVolumeInput(granularValue)
              : projectedIndividual;

            individualVolumes.push({
              time: slot.time,
              expectedIndividual: Math.round(expectedIndividual),
              projectedIndividual: Math.round(projectedIndividual),
              actualIndividual: Math.round(actualIndividual),
              hasOverride: !!granularValue,
              isPreMarket: true,
              isAfterMarket: false,
            });
          } else {
            individualVolumes.push({
              time: slot.time,
              individual: null,
              isPreMarket: slot.isPreMarket,
              isAfterMarket: slot.isAfterMarket,
            });
          }
          continue;
        }

        if (slot.isAfterMarket) {
          individualVolumes.push({
            time: slot.time,
            individual: null,
            isPreMarket: slot.isPreMarket,
            isAfterMarket: slot.isAfterMarket,
          });
          continue;
        }

        const expectedCumulative = getExpectedVolumeAtTime(slot.time) || 0;
        const expectedIndividual = expectedCumulative - prevExpectedCumulative;
        prevExpectedCumulative = expectedCumulative;

        // Calculate the projected individual volume based on baselineProjectedDaily
        // Use the ratio: (projected / expected) * expectedIndividual
        let projectedIndividual = 0;
        if (avgVolume50Day > 0 && expectedIndividual > 0) {
          projectedIndividual =
            (baselineProjectedDaily / avgVolume50Day) * expectedIndividual;
        }

        // Check if user has overridden this specific slot (with individual volume)
        const granularValue = granularData[slot.time];
        const actualIndividual = granularValue
          ? parseVolumeInput(granularValue)
          : projectedIndividual;

        individualVolumes.push({
          time: slot.time,
          expectedIndividual: Math.round(expectedIndividual),
          projectedIndividual: Math.round(projectedIndividual),
          actualIndividual: Math.round(actualIndividual),
          hasOverride: !!granularValue,
          isPreMarket: slot.isPreMarket,
          isAfterMarket: slot.isAfterMarket,
        });
      }

      // Step 5: Calculate cumulative actual by summing individual volumes
      // Also recalculate projection after any overrides
      let cumulativeActual = 0;
      let lastOverrideIndex = -1;

      // First pass: find the last override and sum up to that point
      for (let i = 0; i < individualVolumes.length; i++) {
        const vol = individualVolumes[i];
        if (vol.hasOverride) {
          lastOverrideIndex = i;
        }
      }

      // Calculate new projected daily if there are overrides
      let adjustedProjectedDaily = baselineProjectedDaily;
      if (lastOverrideIndex >= 0) {
        // Sum up all individual volumes up to and including last override
        let sumActual = 0;
        let expectedAtLastOverride = 0;
        for (let i = 0; i <= lastOverrideIndex; i++) {
          const vol = individualVolumes[i];
          if (vol.actualIndividual !== null && !isNaN(vol.actualIndividual)) {
            sumActual += vol.actualIndividual;
          }
        }
        // Get expected cumulative at last override time
        const lastOverrideSlot = individualVolumes[lastOverrideIndex];
        expectedAtLastOverride =
          getExpectedVolumeAtTime(lastOverrideSlot.time) || 0;

        // Calculate new projection ratio
        if (expectedAtLastOverride > 0) {
          adjustedProjectedDaily =
            (sumActual / expectedAtLastOverride) * avgVolume50Day;
        }
      }

      // Step 6: Build final chart data with cumulative values
      const data = [];
      cumulativeActual = 0;
      let cumulativeExpected = 0;

      for (let i = 0; i < individualVolumes.length; i++) {
        const vol = individualVolumes[i];
        const slot = timeSlots[i];

        if (vol.isPreMarket) {
          // Handle premarket data points
          const premarketPct = PREMARKET_DISTRIBUTION[vol.time];
          if (premarketPct && vol.expectedIndividual !== undefined) {
            const expectedCumulative = avgVolume50Day * premarketPct;

            // Calculate individual volume to add for this slot
            let individualToAdd = 0;

            if (lastOverrideIndex === -1) {
              individualToAdd = vol.projectedIndividual || 0;
            } else if (i <= lastOverrideIndex) {
              individualToAdd = vol.actualIndividual || 0;
            } else {
              if (avgVolume50Day > 0 && vol.expectedIndividual > 0) {
                individualToAdd =
                  (adjustedProjectedDaily / avgVolume50Day) *
                  vol.expectedIndividual;
              }
            }

            cumulativeActual += individualToAdd;
            cumulativeExpected = expectedCumulative;

            data.push({
              time: vol.time,
              expected: Math.round(expectedCumulative),
              actual:
                currentDailyVolume > 0 ? Math.round(cumulativeActual) : null,
              isPreMarket: true,
              isAfterMarket: false,
            });
          } else {
            data.push({
              time: vol.time,
              expected: null,
              actual: null,
              isPreMarket: vol.isPreMarket,
              isAfterMarket: vol.isAfterMarket,
            });
          }
          continue;
        }

        if (vol.isAfterMarket) {
          data.push({
            time: vol.time,
            expected: null,
            actual: null,
            isPreMarket: vol.isPreMarket,
            isAfterMarket: vol.isAfterMarket,
          });
          continue;
        }

        const expectedCumulative = getExpectedVolumeAtTime(vol.time);
        cumulativeExpected = expectedCumulative || 0;

        // Calculate individual volume to add for this slot
        let individualToAdd = 0;

        if (lastOverrideIndex === -1) {
          // No overrides at all - use the baseline projected individual
          individualToAdd = vol.projectedIndividual || 0;
        } else if (i <= lastOverrideIndex) {
          // Up to and including last override - use actual individual (which includes overrides)
          individualToAdd = vol.actualIndividual || 0;
        } else {
          // After last override: project based on adjusted ratio
          if (avgVolume50Day > 0 && vol.expectedIndividual > 0) {
            individualToAdd =
              (adjustedProjectedDaily / avgVolume50Day) *
              vol.expectedIndividual;
          }
        }

        cumulativeActual += individualToAdd;

        data.push({
          time: vol.time,
          expected: Math.round(cumulativeExpected),
          actual: currentDailyVolume > 0 ? Math.round(cumulativeActual) : null,
          isPreMarket: vol.isPreMarket,
          isAfterMarket: vol.isAfterMarket,
        });
      }

      setChartData(data);
    }
  }, [
    currentTime,
    avgVolume50Day,
    currentVolume,
    activeTab,
    granularData,
    timeSlots,
    ticker,
    newDailyVolumeInput,
  ]);

  // Helper to get projected individual volume for a slot (for pre-filling inputs)
  const getProjectedIndividualAtTime = timeStr => {
    const currentDailyVolume = newDailyVolumeInput
      ? parseVolumeInput(newDailyVolumeInput)
      : 0;
    if (currentDailyVolume <= 0) return null;

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    // Find current time's expected percentage
    let currentExpectedPct = 1.0;
    if (
      currentMinutes >= MARKET_OPEN_MINUTES &&
      currentMinutes <= MARKET_CLOSE_MINUTES
    ) {
      for (let i = 0; i < VOLUME_DISTRIBUTION.length; i++) {
        const [h, m] = VOLUME_DISTRIBUTION[i].time.split(':').map(Number);
        const pointMinutes = h * 60 + m;

        if (pointMinutes >= currentMinutes) {
          if (i === 0) {
            currentExpectedPct = VOLUME_DISTRIBUTION[i].pct;
          } else {
            const [prevH, prevM] = VOLUME_DISTRIBUTION[i - 1].time
              .split(':')
              .map(Number);
            const prevMinutes = prevH * 60 + prevM;
            const ratio =
              (currentMinutes - prevMinutes) / (pointMinutes - prevMinutes);
            currentExpectedPct =
              VOLUME_DISTRIBUTION[i - 1].pct +
              (VOLUME_DISTRIBUTION[i].pct - VOLUME_DISTRIBUTION[i - 1].pct) *
                ratio;
          }
          break;
        }
      }
    }

    const baselineProjectedDaily =
      currentExpectedPct > 0 ? currentDailyVolume / currentExpectedPct : 0;
    const expectedIndividual = getIndividualVolumeAtTime(timeStr);

    if (expectedIndividual && avgVolume50Day > 0) {
      return Math.round(
        (baselineProjectedDaily / avgVolume50Day) * expectedIndividual
      );
    }
    return null;
  };

  return {
    chartData,
    getCurrentExpected,
    timeSlots,
    getExpectedVolumeAtTime,
    getIndividualVolumeAtTime,
    getProjectedIndividualAtTime,
  };
};
