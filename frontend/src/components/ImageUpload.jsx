import { useState } from "react";
import { predictHerb } from "../services/api";

export default function ImageUpload() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleUpload = async (e) => {
    const image = e.target.files[0];
    if (!image) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(image);
    setPreview(previewUrl);

    setLoading(true);
    setResult(null);

    try {
      const res = await predictHerb(image);
      setResult(res);
    } catch (err) {
      alert("Prediction failed");
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
          <h3>Result</h3>
          <p><strong>Herb:</strong> {result.herb}</p>
          <p><strong>Confidence:</strong> {result.confidence}%</p>
        </div>
      )}
    </>
  );
}
