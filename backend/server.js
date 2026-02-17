require('dotenv').config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const cors = require("cors");
const { performExplainableGeoValidation } = require("./services/geoValidationService");

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const HOST_IP = process.env.HOST_IP || '31.97.239.242';

// METADATA PATH
const METADATA_PATH = path.join(__dirname, process.env.METADATA_PATH || "../dataset/metadata");

app.use(cors());
app.use(express.json());

// ---------- MULTER ----------
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ---------- PYTHON ML PREDICTION ----------
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



// ---------- LOAD HERB METADATA ----------
function loadHerbMetadata(herbName) {
  const filePath = path.join(METADATA_PATH, `${herbName}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

app.post("/api/predict", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;
  const { latitude, longitude } = req.body;

  console.log(`🔍 Prediction request: lat=${latitude}, lon=${longitude}`);

  // ---------------- STEP 1: Run ML FIRST ----------------
  console.log(` Running ViT prediction on image...`);
  const mlResult = await runPythonPrediction(imagePath);
  fs.unlinkSync(imagePath);

  if (!mlResult.herb || !mlResult.confidence) {
    return res.status(500).json({ 
      error: "ML prediction failed",
      message: "Vision Transformer model could not process the image" 
    });
  }

  console.log(`ViT prediction: ${mlResult.herb} (${mlResult.confidence}%)`);

  // ---------------- STEP 2: Check if location exists ----------------
  if (!latitude || !longitude) {
    console.log("⚠️ No location provided. Skipping geo-validation.");

    return res.json({
      success: true,
      herb: mlResult.herb,
      visualConfidence: mlResult.confidence,
      finalConfidence: mlResult.confidence,
      message: "Location not provided. Showing visual confidence only.",
      validationResults: null
    });
  }

  // ---------------- STEP 3: Validate coordinates ----------------
  const userLat = parseFloat(latitude);
  const userLon = parseFloat(longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ 
      error: "Invalid coordinates",
      message: "Latitude and longitude must be valid numbers" 
    });
  }

  // ---------------- STEP 4: Load metadata ----------------
  const herbMetadata = loadHerbMetadata(mlResult.herb);

  if (!herbMetadata || !herbMetadata.locations || herbMetadata.locations.length === 0) {
    console.log(`⚠️ No geographical data for ${mlResult.herb}`);
    return res.json({
      success: true,
      herb: mlResult.herb,
      visualConfidence: mlResult.confidence,
      finalConfidence: mlResult.confidence,
      message: "No geographical data available for validation",
      validationResults: null
    });
  }

  // ---------------- STEP 5: Perform geo validation ----------------
  console.log(` Running explainable geo-validation...`);
  const validationResults = performExplainableGeoValidation(
    userLat, 
    userLon, 
    herbMetadata, 
    mlResult.confidence
  );

  console.log(`📊 Validation complete: Final confidence ${validationResults.finalConfidence.score}%`);

  // ---------------- STEP 6: Return combined result ----------------
  res.json({
    success: true,
    herb: mlResult.herb,
    validationResults: validationResults,
    visualConfidence: mlResult.confidence,
    finalConfidence: validationResults.finalConfidence.score,
    locationPlausibilityScore: validationResults.locationPlausibility.score,
    geographicalValidationScore: validationResults.geographicalValidation.score,
    nearestDistanceKm: validationResults.locationPlausibility.nearestDistance
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

app.get("/" , (req,res) =>{
  res.send("Working")
})



app.listen(PORT, () =>
  console.log(`✅ Backend running at ${PORT}`)
);
