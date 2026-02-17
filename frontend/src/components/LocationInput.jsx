import { useState } from "react";
import { getCurrentLocation } from "../services/api";
import LocationStatus from "./LocationStatus";

export default function LocationInput({ onLocationChange }) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState(false);

  const handleCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      onLocationChange(loc);
    } catch (err) {
      setError(err.message);
      onLocationChange(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const lat = parseFloat(formData.get("latitude"));
    const lng = parseFloat(formData.get("longitude"));
    
    if (isNaN(lat) || isNaN(lng)) {
      setError("Invalid coordinates");
      return;
    }
    
    const loc = { latitude: lat, longitude: lng };
    setLocation(loc);
    onLocationChange(loc);
    setError(null);
  };

  const clearLocation = () => {
    setLocation(null);
    setError(null);
    onLocationChange(null);
  };

  return (
    <div className="location-input">
      <h3>Location (Optional)</h3>
{/* <p className="location-subtitle">
  Providing location enables geographical validation for improved accuracy.
</p> */}

      <LocationStatus location={location} error={error} />
      
      {!location && (
        <div className="location-controls">
          <button 
            onClick={handleCurrentLocation} 
            disabled={loading}
            className="location-btn current"
          >
            {loading ? "Getting Location..." : "Use Current Location"}
          </button>
          
          <button 
            onClick={() => setManualInput(!manualInput)}
            className="location-btn manual"
          >
            Enter Manually
          </button>
          
          {manualInput && (
            <form onSubmit={handleManualInput} className="manual-form">
              <input 
                name="latitude" 
                type="number" 
                step="any" 
                placeholder="Latitude" 
                required 
              />
              <input 
                name="longitude" 
                type="number" 
                step="any" 
                placeholder="Longitude" 
                required 
              />
              <button type="submit">Set Location</button>
            </form>
          )}
        </div>
      )}
      
      {location && (
        <button onClick={clearLocation} className="location-btn clear">
          Change Location
        </button>
      )}
    </div>
  );
}