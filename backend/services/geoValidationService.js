const haversine = require("../utils/haversine");

// Configuration for explainable validation
const VALIDATION_CONFIG = {
  // Distance thresholds for location plausibility scoring
  DISTANCE_THRESHOLDS: {
    EXCELLENT: 10,    // <= 10km = 1.0 score
    GOOD: 50,         // <= 50km = 0.8 score  
    FAIR: 200,        // <= 200km = 0.6 score
    POOR: 500,        // <= 500km = 0.4 score
    VERY_POOR: 1000   // <= 1000km = 0.2 score
  },
  
  // Confidence fusion weights (must sum to 1.0)
  FUSION_WEIGHTS: {
    VISUAL: 0.7,      // 70% weight for ViT visual confidence
    GEOGRAPHICAL: 0.3 // 30% weight for geographical validation
  }
};

/**
 * STEP 1: Calculate Location Plausibility Score
 * Finds nearest herb occurrence and converts distance to normalized score
 * 
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude  
 * @param {Array} locations - Array of known herb locations
 * @returns {Object} {nearestDistance, plausibilityScore, explanation}
 */
function calculateLocationPlausibility(userLat, userLon, locations) {
  let nearestDistance = Infinity;
  
  // Find minimum distance to any known herb location
  locations.forEach(location => {
    const distance = haversine(
      userLat, userLon,
      location.latitude, location.longitude
    );
    nearestDistance = Math.min(nearestDistance, distance);
  });
  
  // Convert distance to normalized plausibility score
  let plausibilityScore = 0.1; // Minimum score
  let explanation = "Very unlikely location";
  
  if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.EXCELLENT) {
    plausibilityScore = 1.0;
    explanation = "Excellent - Very close to known occurrence";
  } else if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.GOOD) {
    plausibilityScore = 0.8;
    explanation = "Good - Close to known occurrence";
  } else if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.FAIR) {
    plausibilityScore = 0.6;
    explanation = "Fair - Moderately close to known occurrence";
  } else if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.POOR) {
    plausibilityScore = 0.4;
    explanation = "Poor - Far from known occurrences";
  } else if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.VERY_POOR) {
    plausibilityScore = 0.2;
    explanation = "Very poor - Very far from known occurrences";
  }
  
  return {
    nearestDistance: nearestDistance === Infinity ? null : nearestDistance,
    plausibilityScore,
    explanation
  };
}

/**
 * STEP 2: Calculate Geographical Validation Score
 * Currently uses same logic as plausibility, but kept separate for future enhancements
 * 
 * @param {Object} plausibilityResult - Result from calculateLocationPlausibility
 * @returns {Object} {validationScore, explanation}
 */
function calculateGeographicalValidation(plausibilityResult) {
  return {
    validationScore: plausibilityResult.plausibilityScore,
    explanation: `Geographical validation based on distance: ${plausibilityResult.explanation}`
  };
}

/**
 * STEP 3: Calculate Final Confidence Score
 * Fuses visual confidence with geographical validation using configured weights
 * 
 * @param {number} visualConfidence - ViT model confidence (0-100)
 * @param {number} geoValidationScore - Geographical validation score (0-1)
 * @returns {Object} {finalConfidence, explanation, weights}
 */
function calculateFinalConfidence(visualConfidence, geoValidationScore) {
  const finalConfidence = Math.round(
    (visualConfidence * VALIDATION_CONFIG.FUSION_WEIGHTS.VISUAL) +
    (geoValidationScore * 100 * VALIDATION_CONFIG.FUSION_WEIGHTS.GEOGRAPHICAL)
  );
  
  return {
    finalConfidence,
    explanation: `Weighted combination: ${VALIDATION_CONFIG.FUSION_WEIGHTS.VISUAL * 100}% visual + ${VALIDATION_CONFIG.FUSION_WEIGHTS.GEOGRAPHICAL * 100}% geographical`,
    weights: VALIDATION_CONFIG.FUSION_WEIGHTS
  };
}

/**
 * MAIN FUNCTION: Complete Explainable Geo Validation Pipeline
 * Processes user location against herb metadata and returns all intermediate scores
 * 
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {Object} herbData - Herb metadata with locations array
 * @param {number} visualConfidence - ViT model confidence score
 * @returns {Object} Complete validation results with all intermediate scores
 */
function performExplainableGeoValidation(userLat, userLon, herbData, visualConfidence) {
  // Step 1: Location Plausibility
  const plausibilityResult = calculateLocationPlausibility(userLat, userLon, herbData.locations);
  
  // Step 2: Geographical Validation  
  const geoValidationResult = calculateGeographicalValidation(plausibilityResult);
  
  // Step 3: Final Confidence Fusion
  const finalConfidenceResult = calculateFinalConfidence(visualConfidence, geoValidationResult.validationScore);
  
  return {
    // Input data
    userLocation: { latitude: userLat, longitude: userLon },
    herbName: herbData.herb || herbData.scientific_name,
    
    // Step-by-step results
    visualConfidence: {
      score: visualConfidence,
      explanation: "Confidence from Vision Transformer (ViT) model"
    },
    
    locationPlausibility: {
      score: plausibilityResult.plausibilityScore,
      nearestDistance: plausibilityResult.nearestDistance,
      explanation: plausibilityResult.explanation
    },
    
    geographicalValidation: {
      score: geoValidationResult.validationScore,
      explanation: geoValidationResult.explanation
    },
    
    finalConfidence: {
      score: finalConfidenceResult.finalConfidence,
      explanation: finalConfidenceResult.explanation,
      weights: finalConfidenceResult.weights
    },
    
    // Configuration used
    config: VALIDATION_CONFIG
  };
}

module.exports = {
  performExplainableGeoValidation,
  VALIDATION_CONFIG
};
