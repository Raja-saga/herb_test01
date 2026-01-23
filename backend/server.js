const express = require("express");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3001;

// 🔥 CORRECT METADATA PATH
const METADATA_PATH = path.join(__dirname, "../dataset/metadata");

app.use(cors());
app.use(express.json());

// ---------- MULTER ----------
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ---------- PYTHON ----------
function runPythonPrediction(imagePath) {
  return new Promise((resolve) => {
    const script = path.join(__dirname, "../ml_service/predict.py");
    const py = spawn("python", [script, imagePath]);

    let output = "";

    py.stdout.on("data", (d) => (output += d.toString()));
    py.stderr.on("data", (e) => console.error(e.toString()));

    py.on("close", () => {
      try {
        resolve(JSON.parse(output.trim()));
      } catch {
        resolve({ success: false });
      }
    });
  });
}

// ---------- PREDICT ----------
app.post("/api/predict", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;
  const result = await runPythonPrediction(imagePath);
  fs.unlinkSync(imagePath);

  if (!result.herb) {
    return res.status(500).json({ error: "Prediction failed" });
  }

  res.json({
    herb: result.herb,
    confidence: result.confidence,
  });
});

// Test endpoint to verify dataset access
app.get('/api/test-locations', (req, res) => {
  const testHerb = 'Acorus_calamus';
  const filePath = path.join(__dirname, '../dataset/metadata', `${testHerb}.json`);
  
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({
      message: 'Dataset access working',
      herb: testHerb,
      locationCount: data.locations.length,
      sampleLocations: data.locations.slice(0, 3)
    });
  } else {
    res.json({ error: 'Dataset not found', path: filePath });
  }
});

// Enhanced backend with direct dataset integration
app.get('/api/locations/:herbName', (req, res) => {
  const { herbName } = req.params;

  const filePath = path.join(__dirname, '../dataset/metadata', `${herbName}.json`);

  if (!fs.existsSync(filePath)) {
    return res.json({ herb: herbName, count: 0, locations: [] });
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const locations = raw.locations
    .map((loc) => ({
      lat: Number(loc.lat ?? loc.latitude),
      lng: Number(loc.lon ?? loc.lng ?? loc.longitude),
      name: `${loc.country}${loc.state ? ', ' + loc.state : ''}`,
    }))
    .filter((l) => !isNaN(l.lat) && !isNaN(l.lng));

  console.log(`Sending ${locations.length} valid locations for ${herbName}`);

  res.json({
    herb: herbName,
    count: locations.length,
    locations,
  });
});



app.listen(PORT, () =>
  console.log(`✅ Backend running at http://localhost:${PORT}`)
);
