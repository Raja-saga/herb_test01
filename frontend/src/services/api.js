export async function predictHerb(image) {
  const formData = new FormData();
  formData.append("image", image);

  const res = await fetch("http://localhost:5000/predict", {
    method: "POST",
    body: formData
  });

  return res.json();
}
