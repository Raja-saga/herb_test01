// app.post('/api/predict', upload.single('image'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No image uploaded' });
//   }

//   const imagePath = req.file.path;

//   try {
//     const result = await runPythonPrediction(imagePath);
//     fs.unlinkSync(imagePath);

//     if (!result.success) {
//       return res.status(500).json({ error: result.error });
//     }

//     // 🔥 LOAD LOCATIONS HERE
//     const locations = loadHerbLocations(result.herb);

//     res.json({
//       herb: result.herb,
//       confidence: result.confidence,
//       locations   // ✅ THIS FIXES YOUR MAP
//     });

//   } catch (error) {
//     if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
