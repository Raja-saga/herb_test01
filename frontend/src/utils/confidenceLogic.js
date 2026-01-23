// Confidence-based decision logic for herb predictions
export const CONFIDENCE_THRESHOLDS = {
  LOW: 40,
  UNCERTAIN: 65
};

export const getConfidenceLevel = (confidence) => {
  if (confidence < CONFIDENCE_THRESHOLDS.LOW) return 'LOW';
  if (confidence < CONFIDENCE_THRESHOLDS.UNCERTAIN) return 'UNCERTAIN';
  return 'HIGH';
};

export const getConfidenceMessage = (confidence) => {
  const level = getConfidenceLevel(confidence);
  
  switch (level) {
    case 'LOW':
      return {
        message: "Low confidence prediction. Please upload a clearer image.",
        action: "RETRY",
        showMap: false
      };
    case 'UNCERTAIN':
      return {
        message: "Uncertain prediction. Result may not be accurate.",
        action: "ACCEPT_WITH_WARNING",
        showMap: true
      };
    case 'HIGH':
      return {
        message: "High confidence prediction.",
        action: "ACCEPT",
        showMap: true
      };
    default:
      return { message: "", action: "NONE", showMap: false };
  }
};