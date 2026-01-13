const { scanImage } = require('../../services/ocrService'); // Doesn't exist yet
const Tesseract = require('tesseract.js');

jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(),
}));

describe('OCR Service', () => {
  it('should extract text from an image', async () => {
    // Mock Setup
    const mockWorker = {
      recognize: jest.fn().mockResolvedValue({
        data: { text: 'Hello World' }
      }),
      terminate: jest.fn().mockResolvedValue(),
    };
    
    Tesseract.createWorker.mockResolvedValue(mockWorker);

    // Execution
    const text = await scanImage('dummy-image-path.jpg');

    // Assertion
    expect(text).toBe('Hello World');
    expect(Tesseract.createWorker).toHaveBeenCalledWith('eng');
    expect(mockWorker.recognize).toHaveBeenCalledWith('dummy-image-path.jpg');
    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    Tesseract.createWorker.mockRejectedValue(new Error('OCR Failed'));

    await expect(scanImage('bad-path.jpg')).rejects.toThrow('OCR Failed');
  });
});
