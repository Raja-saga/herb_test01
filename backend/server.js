const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.post("/predict", upload.single("image"), (req, res) => {
  console.log(" Image received");

  const imagePath = path.join(__dirname, req.file.path);

  exec(
    `python ../ml_service/predict.py ${imagePath}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(" Python error:", error);
        return res.status(500).json({ error: "Prediction failed" });
      }

      console.log(" Python output:", stdout);
      res.json(JSON.parse(stdout));
    }
  );
});

app.listen(5000, () => {
  console.log(" Backend running on http://localhost:5000");
});
