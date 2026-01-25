export function getConfidenceMessage(confidence) {
  if (confidence < 40) {
    return {
      action: 'RETRY',
      message: 'Confidence too low. Please upload a clearer image.',
      showMap: false
    };
  } else if (confidence < 65) {
    return {
      action: 'ACCEPT_WITH_WARNING',
      message: 'Uncertain prediction. Results may not be accurate.',
      showMap: true
    };
  } else {
    return {
      action: 'ACCEPT',
      message: 'High confidence prediction.',
      showMap: true
    };
  }
}