import { useState } from "react";
import { predictHerb } from "../services/api";
import { getConfidenceMessage } from "../utils/confidenceLogic";

export default function ImageUpload({ onPredictionChange, location }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confidenceInfo, setConfidenceInfo] = useState(null);

  const handleUpload = async (e) => {
    const image = e.target.files[0];
    if (!image) return;

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const previewUrl = URL.createObjectURL(image);
    setPreview(previewUrl);

    setResult(null);
    setConfidenceInfo(null);
    setLoading(true);

    try {
      console.log('Starting prediction. Location (optional):', location);

      const res = await predictHerb(image, location || null);

      if (!res.herb || res.visualConfidence === undefined) {
        throw new Error('Invalid prediction response');
      }

      const displayConfidence = res.finalConfidence || res.visualConfidence;
      const confInfo = getConfidenceMessage(displayConfidence);

      setResult({
        herb: res.herb,
        visualConfidence: res.visualConfidence,
        finalConfidence: res.finalConfidence,
        locationPlausibilityScore: res.locationPlausibilityScore,
        nearestDistanceKm: res.nearestDistanceKm,
        success: res.success
      });

      setConfidenceInfo(confInfo);

      onPredictionChange({
        herb: res.herb,
        confidence: res.visualConfidence,
        finalConfidence: res.finalConfidence
      });

    } catch (err) {
      console.error('Prediction error:', err);
      setResult({ error: err.message || 'Prediction failed' });
      setConfidenceInfo(null);
      onPredictionChange(null);
    }

    setLoading(false);
  };

  const isLocationProvided = location && location.latitude && location.longitude;

  return (
    <>
      <div className="upload-section">
        <h3>Herb Image Upload</h3>

        <div className="upload-box">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
          />


          {/* {!isLocationProvided && (
            <p className="location-warning">Location required for prediction</p>
          )} */}
        </div>

        {/* IMAGE PREVIEW */}
        {preview && (
          <div className="preview">
            <img src={preview} alt="Uploaded herb" />
          </div>
        )}

        {loading && (
          <div className="loading">
            <p>Processing image...</p>
            <p>• Running ViT classification</p>
            {location && <p>• Performing geo-validation</p>}
            <p>• Computing final confidence</p>
          </div>
        )}

      </div>

      {/* PREDICTION RESULTS */}
      {result && (
        <div className="result-section">
          {result.error ? (
            <div className="error">
              <h3>Error</h3>
              <p>{result.error}</p>
              <button onClick={() => document.querySelector('input[type="file"]').click()}>
                Try Another Image
              </button>
            </div>
          ) : (
            <div className="basic-result">
              <h3>Prediction Result</h3>
              <p><strong>Identified Herb:</strong> {result.herb}</p>
              <p><strong>Visual Confidence:</strong> {result.visualConfidence}%</p>
              <p><strong>Location Plausibility:</strong> {result.locationPlausibilityScore ? (result.locationPlausibilityScore * 100).toFixed(1) + '%' : 'N/A'}</p>
              <p><strong>Nearest Distance:</strong> {result.nearestDistanceKm ? result.nearestDistanceKm.toFixed(1) + ' km' : 'Unknown'}</p>
              <p><strong>Final Confidence:</strong> {result.finalConfidence}%</p>

              {confidenceInfo && (
                <div className={`confidence-message ${confidenceInfo.action.toLowerCase()}`}>
                  <p>{confidenceInfo.message}</p>
                  {confidenceInfo.action === 'RETRY' && (
                    <button onClick={() => document.querySelector('input[type="file"]').click()}>
                      Upload Another Image
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}