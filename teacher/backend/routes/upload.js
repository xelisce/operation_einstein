const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { scanImage } = require('../services/ocrService');

// Configure Multer
const upload = multer({ dest: 'uploads/' });

// POST /api/upload
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const text = await scanImage(req.file.path);
    
    // Cleanup: Delete the file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    res.json({ text });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
