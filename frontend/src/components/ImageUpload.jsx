import { useState } from "react";
import { predictHerb } from "../services/api";
import { getConfidenceMessage } from "../utils/confidenceLogic";

export default function ImageUpload({ onPredictionChange }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confidenceInfo, setConfidenceInfo] = useState(null);

  const handleUpload = async (e) => {
    const image = e.target.files[0];
    if (!image) return;

    // Cleanup previous preview URL to prevent memory leaks
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    // Create new preview URL immediately
    const previewUrl = URL.createObjectURL(image);
    setPreview(previewUrl);

    // Reset states
    setResult(null);
    setConfidenceInfo(null);
    setLoading(true);

    try {
      const res = await predictHerb(image);
      
      if (!res.herb || res.confidence === undefined) {
        throw new Error('Invalid prediction response');
      }
      
      const confInfo = getConfidenceMessage(res.confidence);
      
      setResult(res);
      setConfidenceInfo(confInfo);
      
      // Always notify parent - map will decide what to show
      onPredictionChange({
        herb: res.herb,
        confidence: res.confidence
      });
    } catch (err) {
      console.error('Prediction error:', err);
      setResult({ error: err.message || 'Prediction failed' });
      setConfidenceInfo(null);
      onPredictionChange(null);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="upload-box">
        <input type="file" accept="image/*" onChange={handleUpload} />
      </div>

      {/* IMAGE PREVIEW */}
      {preview && (
        <div className="preview">
          <img src={preview} alt="Uploaded herb" />
        </div>
      )}

      {loading && <p className="loading">Predicting...</p>}

      {result && (
        <div className="result">
          {result.error ? (
            <div className="error">
              <h3>Error</h3>
              <p>{result.error}</p>
              <button onClick={() => document.querySelector('input[type="file"]').click()}>
                Try Another Image
              </button>
            </div>
          ) : confidenceInfo ? (
            <>
              <h3>Result</h3>
              <p><strong>Herb:</strong> {result.herb}</p>
              <p><strong>Confidence:</strong> {result.confidence}%</p>
              
              <div className={`confidence-message ${confidenceInfo.action.toLowerCase()}`}>
                <p>{confidenceInfo.message}</p>
                {confidenceInfo.action === 'RETRY' && (
                  <button onClick={() => document.querySelector('input[type="file"]').click()}>
                    Upload Another Image
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}
