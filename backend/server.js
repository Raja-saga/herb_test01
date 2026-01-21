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

// ---------- LOCATIONS ----------
app.get("/api/locations/:herbName", (req, res) => {
  const filePath = path.join(
    METADATA_PATH,
    `${req.params.herbName}.json`
  );

  if (!fs.existsSync(filePath)) {
    return res.json({ count: 0, locations: [] });
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const locations = raw.locations.map((l) => ({
    lat: Number(l.latitude),
    lng: Number(l.longitude),
    name: `${l.country}${l.state ? ", " + l.state : ""}`,
  }));

  console.log(`✅ Sending ${locations.length} locations`);

  res.json({
    count: locations.length,
    locations,
  });
});

app.listen(PORT, () =>
  console.log(`✅ Backend running at http://localhost:${PORT}`)
);
