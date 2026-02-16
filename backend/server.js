const express = require("express");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const cors = require("cors");
const { performExplainableGeoValidation } = require("./services/geoValidationService");

const app = express();
const PORT = 3001;

// METADATA PATH
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

// ---------- MAIN PREDICTION ENDPOINT WITH EXPLAINABLE VALIDATION ----------
app.post("/api/predict", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;
  const { latitude, longitude } = req.body;

  console.log(`🔍 Prediction request: lat=${latitude}, lon=${longitude}`);

  // STEP 1: Validate location input (MANDATORY)
  if (!latitude || !longitude) {
    fs.unlinkSync(imagePath);
    return res.status(400).json({ 
      error: "Location is mandatory",
      message: "Please provide your location (latitude, longitude) before prediction" 
    });
  }

  const userLat = parseFloat(latitude);
  const userLon = parseFloat(longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    fs.unlinkSync(imagePath);
    return res.status(400).json({ 
      error: "Invalid coordinates",
      message: "Latitude and longitude must be valid numbers" 
    });
  }

  // STEP 2: Get ViT ML prediction
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

  // STEP 3: Load herb geographical metadata
  const herbMetadata = loadHerbMetadata(mlResult.herb);
  if (!herbMetadata || !herbMetadata.locations || herbMetadata.locations.length === 0) {
    console.log(`⚠️ No geographical data for ${mlResult.herb}`);
    return res.json({
      herb: mlResult.herb,
      visualConfidence: mlResult.confidence,
      finalConfidence: mlResult.confidence,
      message: "No geographical data available for validation",
      validationResults: null
    });
  }

  // STEP 4: Perform explainable geo-validation pipeline
  console.log(` Running explainable geo-validation...`);
  const validationResults = performExplainableGeoValidation(
    userLat, 
    userLon, 
    herbMetadata, 
    mlResult.confidence
  );

  console.log(`📊 Validation complete: Final confidence ${validationResults.finalConfidence.score}%`);

  // STEP 5: Return all explainable results
  res.json({
    success: true,
    herb: mlResult.herb,
    
    // All step-by-step validation results for explainable UI
    validationResults: validationResults,
    
    // Legacy fields for backward compatibility
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



app.listen(PORT, () =>
  console.log(`✅ Backend running at http://localhost:${PORT}`)
);
