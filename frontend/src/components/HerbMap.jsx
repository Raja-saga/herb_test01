import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function HerbMap({
  herbName,
  confidence = 0,
  locations = [],
}) {
  const mapRef = useRef(null);
  const map = useRef(null);
  const markers = useRef(null);

  // INIT MAP ONCE
  useEffect(() => {
    if (map.current || !mapRef.current) return;

    map.current = L.map(mapRef.current).setView([20.59, 78.96], 3);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map.current);

    markers.current = L.layerGroup().addTo(map.current);

    setTimeout(() => map.current.invalidateSize(), 200);
  }, []);

  // UPDATE MARKERS
  useEffect(() => {
    if (!map.current || !markers.current) return;

    markers.current.clearLayers();

    if (confidence >= 65 && locations.length > 0) {
      locations.forEach((l) => {
        if (!isNaN(l.lat) && !isNaN(l.lng)) {
          L.marker([l.lat, l.lng])
            .bindPopup(`<b>${herbName}</b><br/>${l.name}`)
            .addTo(markers.current);
        }
      });

      const bounds = L.featureGroup(markers.current.getLayers()).getBounds();
      if (bounds.isValid()) {
        map.current.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [locations, confidence, herbName]);

  return (
    <div>
      <h3>Herb Distribution Map</h3>
      <p>
        {!herbName
          ? "Upload an image to see distribution"
          : `Showing ${locations.length} locations for ${herbName}`}
      </p>

      <div
        ref={mapRef}
        style={{
          height: "500px",
          width: "100%",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}
