const { createWorker } = require('tesseract.js');

/**
 * Scans an image and extracts text using Tesseract OCR.
 * @param {string} imagePath - Path or URL to the image.
 * @returns {Promise<string>} - Extracted text.
 */
async function scanImage(imagePath) {
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();
    return text;
  } catch (error) {
    throw new Error(`OCR Failed: ${error.message}`);
  }
}

module.exports = { scanImage };
