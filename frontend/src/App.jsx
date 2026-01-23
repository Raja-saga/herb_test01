import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import HerbMap from './components/HerbMap';
import { getHerbLocations } from './services/api';
import './styles.css';

function App() {
  const [prediction, setPrediction] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handlePredictionChange = async (pred) => {
    console.log('🔍 App received prediction:', pred);
    setPrediction(pred);

    if (!pred || pred.confidence < 40) {
      console.log('❌ Confidence too low or no prediction');
      setLocations([]);
      return;
    }

    console.log(`🚀 Fetching locations for ${pred.herb} (${pred.confidence}%)`);
    setLoading(true);
    
    try {
      const response = await getHerbLocations(pred.herb);
      console.log('📦 API Response:', response);
      
      const locationData = response.locations || [];
      console.log(`✅ Setting ${locationData.length} locations`);
      setLocations(locationData);
    } catch (err) {
      console.error('❌ Location fetch failed:', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="left-panel">
        <h1>Herb Recognition System</h1>
        <ImageUpload onPredictionChange={handlePredictionChange} />
        {loading && <p>🔄 Loading distribution data…</p>}
        
        {/* Debug Info */}
        {prediction && (
          <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
            Debug: {prediction.herb} ({prediction.confidence}%) | {locations.length} locations
          </div>
        )}
      </div>

      <div className="right-panel">
        <HerbMap
          herbName={prediction?.herb}
          confidence={prediction?.confidence || 0}
          locations={locations}
        />
      </div>
    </div>
  );
}

export default App;
