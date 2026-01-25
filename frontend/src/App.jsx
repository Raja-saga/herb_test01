import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import LocationInput from './components/LocationInput';
import HerbMap from './components/HerbMap';
import { getHerbLocations } from './services/api';
import './styles.css';

function App() {
  const [prediction, setPrediction] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const handleLocationChange = (location) => {
    console.log('Location updated:', location);
    setUserLocation(location);
    // Clear previous prediction when location changes
    if (prediction) {
      setPrediction(null);
      setLocations([]);
    }
  };

  const handlePredictionChange = async (pred) => {
    console.log('App received prediction:', pred);
    setPrediction(pred);

    if (!pred) {
      setLocations([]);
      return;
    }

    // Use final confidence for map display logic
    const displayConfidence = pred.finalConfidence || pred.confidence;
    
    if (displayConfidence < 40) {
      console.log('Confidence too low for map display');
      setLocations([]);
      return;
    }

    console.log(`Fetching locations for ${pred.herb} (Final: ${displayConfidence}%)`);
    setLoading(true);
    
    try {
      const response = await getHerbLocations(pred.herb);
      console.log('API Response:', response);
      
      const locationData = response.locations || [];
      console.log(`Setting ${locationData.length} locations`);
      setLocations(locationData);
    } catch (err) {
      console.error('Location fetch failed:', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="left-panel">
        <h1>Medicinal Herb Recognition System</h1>
        <p className="subtitle">Location-Aware AI Classification with Explainable Validation</p>
        
        <LocationInput onLocationChange={handleLocationChange} />
        
        <ImageUpload 
          onPredictionChange={handlePredictionChange} 
          location={userLocation}
        />
        
        {loading && <p className="loading-indicator">Loading herb distribution data…</p>}
      </div>

      <div className="right-panel">
        <HerbMap
          herbName={prediction?.herb}
          confidence={prediction?.finalConfidence || prediction?.confidence || 0}
          locations={locations}
          userLocation={userLocation}
          validationResults={prediction?.validationResults}
        />
      </div>
    </div>
  );
}

export default App;