const API_BASE = "http://localhost:3001/api";

export const predictHerb = async (image, location) => {
  const fd = new FormData();
  fd.append("image", image);
  fd.append("latitude", location.latitude);
  fd.append("longitude", location.longitude);

  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
};

export const getHerbLocations = async (herb) => {
  const res = await fetch(`${API_BASE}/locations/${herb}`);
  if (!res.ok) throw new Error("Location fetch failed");
  return res.json();
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
};
