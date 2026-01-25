import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Create custom user location icon
const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div style="background: #ff4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function HerbMap({ herbName, confidence = 0, locations = [], userLocation, validationResults }) {
  const mapRef = useRef(null);
  const map = useRef(null);
  const markers = useRef(null);
  const userMarker = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (map.current) return;

    map.current = L.map(mapRef.current).setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map.current);
    markers.current = L.layerGroup().addTo(map.current);

    setTimeout(() => map.current.invalidateSize(), 300);
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!map.current) return;
    
    // Remove existing user marker
    if (userMarker.current) {
      map.current.removeLayer(userMarker.current);
      userMarker.current = null;
    }
    
    // Add user location marker if available
    if (userLocation) {
      userMarker.current = L.marker(
        [userLocation.latitude, userLocation.longitude], 
        { icon: userIcon }
      )
        .bindPopup('<b>Your Location</b><br/>Prediction made from here')
        .addTo(map.current);
    }
  }, [userLocation]);

  // Update markers when data changes
  useEffect(() => {
    console.log('HerbMap received:', { herbName, confidence, locationsCount: locations.length });
    
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();

    // Show markers if confidence >= 40% AND we have locations
    if (confidence >= 40 && herbName && locations.length > 0) {
      console.log('Adding markers for', herbName);
      
      let validCount = 0;
      locations.forEach((loc, i) => {
        const lat = Number(loc.lat || loc.latitude);
        const lng = Number(loc.lng || loc.longitude);
        
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          L.marker([lat, lng])
            .bindPopup(`<b>${herbName}</b><br/>${loc.name || loc.country || 'Location ' + (i+1)}`)
            .addTo(markers.current);
          validCount++;
        }
      });
      
      console.log(`Added ${validCount} markers out of ${locations.length} locations`);
      
      // Fit map to show all markers and user location
      if (validCount > 0) {
        const allLayers = [...markers.current.getLayers()];
        if (userMarker.current) {
          allLayers.push(userMarker.current);
        }
        
        if (allLayers.length > 0) {
          const group = L.featureGroup(allLayers);
          const bounds = group.getBounds();
          if (bounds.isValid()) {
            map.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
          }
        }
      }
    } else {
      console.log('Not showing markers:', { confidence, herbName, locationsCount: locations.length });
      
      // If no herb markers but user location exists, center on user
      if (userLocation && userMarker.current) {
        map.current.setView([userLocation.latitude, userLocation.longitude], 6);
      }
    }
  }, [locations, confidence, herbName, userLocation]);

  // Generate status message based on validation results
  const getStatusMessage = () => {
    if (!herbName) {
      return "Provide location and upload herb image to see distribution";
    }
    
    if (confidence < 40) {
      return `Confidence too low (${confidence}%) - Upload clearer image`;
    }
    
    if (locations.length === 0) {
      return `No location data found for ${herbName}`;
    }
    
    const nearestDistance = validationResults?.locationPlausibility?.nearestDistance;
    const distanceText = nearestDistance ? ` (nearest: ${nearestDistance.toFixed(1)} km)` : '';
    
    return `Showing ${locations.length} known locations for ${herbName}${distanceText}`;
  };

  return (
    <div className="herb-map">
      <h3>Herb Distribution Map</h3>
      <p>{getStatusMessage()}</p>
      
      {userLocation && (
        <div style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
          Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </div>
      )}
      
      {validationResults && (
        <div style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
          Final confidence: {validationResults.finalConfidence.score}% 
          (Visual: {validationResults.visualConfidence.score}% + Geo: {(validationResults.geographicalValidation.score * 100).toFixed(1)}%)
        </div>
      )}
      
      <div
        ref={mapRef}
        style={{
          height: "500px",
          width: "100%",
          border: "1px solid #ccc",
          borderRadius: "6px",
        }}
      />
    </div>
  );
}