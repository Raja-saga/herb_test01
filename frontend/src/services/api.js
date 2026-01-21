const API_BASE = "http://localhost:3001/api";

export const predictHerb = async (image) => {
  const fd = new FormData();
  fd.append("image", image);

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
