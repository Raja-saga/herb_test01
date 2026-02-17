const API_BASE = "http://localhost:3001/api";

export const predictHerb = async (image, location) => {
  const formData = new FormData();
  formData.append("image", image);

  if (location?.latitude && location?.longitude) {
    formData.append("latitude", location.latitude);
    formData.append("longitude", location.longitude);
  }

  const response = await fetch("http://localhost:3001/api/predict", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Prediction failed");
  }

  return response.json();
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
