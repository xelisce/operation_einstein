const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const { scanImage } = require('../services/ocrService');

// Configure Multer
const upload = multer({ dest: 'uploads/' });

// POST /api/scan/crop
router.post('/crop', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Parse crop coordinates from body
    // Expecting: { left, top, width, height }
    let cropRegion = null;
    if (req.body.crop) {
      try {
        cropRegion = JSON.parse(req.body.crop);
      } catch (e) {
        console.error('Invalid crop JSON', e);
      }
    }

    let imagePathToScan = req.file.path;
    let tempCroppedPath = null;

    // If crop region provided, process with Sharp
    if (cropRegion && cropRegion.width && cropRegion.height) {
      tempCroppedPath = `uploads/cropped-${req.file.filename}.png`;
      
      // Ensure coordinates are integers
      const region = {
        left: Math.round(Number(cropRegion.x)),
        top: Math.round(Number(cropRegion.y)),
        width: Math.round(Number(cropRegion.width)),
        height: Math.round(Number(cropRegion.height))
      };

      await sharp(req.file.path)
        .extract(region)
        .toFile(tempCroppedPath);
      
      imagePathToScan = tempCroppedPath;
    }

    // Run OCR
    const text = await scanImage(imagePathToScan);
    
    // Cleanup
    fs.unlink(req.file.path, () => {});
    if (tempCroppedPath) fs.unlink(tempCroppedPath, () => {});

    res.json({ text });
  } catch (err) {
    console.error(err);
    // Cleanup on error
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;