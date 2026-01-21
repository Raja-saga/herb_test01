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
    setPrediction(pred);

    if (!pred || pred.confidence < 65) {
      setLocations([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getHerbLocations(pred.herb);
      setLocations(res.locations || []);
    } catch (err) {
      console.error(err);
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
        {loading && <p>Loading distribution data…</p>}
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
