Solution Overview
Based on your requirements, here's what needs to be implemented:
Key Changes Needed:

Initial State: The "Actual Volume" graph should start as an exact copy of the "Expected Volume" graph
User Input Handling: When a user inputs a value at a specific time slot, recalculate:

That specific node with the new value
Adjust the slope for future projections
Smooth the projection for realistic forecasting


New Input Field: Add a "Current Daily Volume" input in the advanced tab

Implementation Strategy:
Step 1: Add Daily Volume Input (in Advanced Tab)
jsxconst [currentDailyVolume, setCurrentDailyVolume] = useState(50000000); // Default 50M
Step 2: Calculate Expected Volume Per 5-Min Slot
jsxconst slotsPerDay = 78; // 6.5 hours * 12 five-minute slots
const expectedVolumePerSlot = currentDailyVolume / slotsPerDay;
Step 3: Initialize Actual Volume from Expected
jsx// On component mount or when expected volume changes
const initializeActualVolume = () => {
  return expectedVolumeData.map(point => ({
    ...point,
    actual: point.expected
  }));
};
Step 4: Recalculate on User Input
jsxconst updateActualVolume = (timeSlot, userInputVolume) => {
  const updatedData = [...actualVolumeData];
  const slotIndex = updatedData.findIndex(d => d.time === timeSlot);
  
  // Update the specific slot
  updatedData[slotIndex].actual = userInputVolume;
  
  // Calculate cumulative volume up to this point
  const cumulativeActual = updatedData
    .slice(0, slotIndex + 1)
    .reduce((sum, d) => sum + d.actual, 0);
  
  // Calculate remaining slots
  const remainingSlots = updatedData.length - slotIndex - 1;
  
  // Calculate new daily projection
  const newDailyProjection = cumulativeActual + (expectedVolumePerSlot * remainingSlots);
  
  // Smooth the adjustment across remaining slots
  const adjustmentFactor = newDailyProjection / currentDailyVolume;
  
  for (let i = slotIndex + 1; i < updatedData.length; i++) {
    updatedData[i].actual = updatedData[i].expected * adjustmentFactor;
  }
  
  return updatedData;
};