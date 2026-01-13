const request = require('supertest');
const app = require('../../app');
const path = require('path');
const fs = require('fs');

// Mock the OCR service to avoid real Tesseract usage
jest.mock('../../services/ocrService', () => ({
  scanImage: jest.fn().mockResolvedValue('MOCKED OCR TEXT'),
}));

describe('Upload API', () => {
  const tempFilePath = path.join(__dirname, 'temp_test_image.txt');

  beforeAll(() => {
    // Create a dummy file to upload
    fs.writeFileSync(tempFilePath, 'dummy image content');
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  it('should upload a file and return extracted text', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('image', tempFilePath); // 'image' is the field name we expect

    expect(res.statusCode).toEqual(200);
    expect(res.body.text).toEqual('MOCKED OCR TEXT');
  });
});
