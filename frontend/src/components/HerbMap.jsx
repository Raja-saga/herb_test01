import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function HerbMap({ herbName, confidence = 0, locations = [] }) {
  const mapRef = useRef(null);
  const map = useRef(null);
  const markers = useRef(null);

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

  // Update markers when data changes
  useEffect(() => {
    console.log('🗺️ HerbMap received:', { herbName, confidence, locationsCount: locations.length });
    
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();

    // Show markers if confidence >= 40% AND we have locations
    if (confidence >= 40 && herbName && locations.length > 0) {
      console.log('✅ Adding markers for', herbName);
      
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
      
      console.log(`📍 Added ${validCount} markers out of ${locations.length} locations`);
      
      // Fit map to show all markers
      if (validCount > 0) {
        const group = L.featureGroup(markers.current.getLayers());
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          map.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
        }
      }
    } else {
      console.log('❌ Not showing markers:', { confidence, herbName, locationsCount: locations.length });
    }
  }, [locations, confidence, herbName]);

  const statusMessage = !herbName
    ? "Upload an herb image to see distribution"
    : confidence < 65
    ? `Low confidence (${confidence}%) - Upload clearer image`
    : locations.length === 0
    ? `No location data found for ${herbName}`
    : `Showing ${locations.length} locations for ${herbName}`;

  return (
    <div className="herb-map">
      <h3>Herb Distribution Map</h3>
      <p>{statusMessage}</p>
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
