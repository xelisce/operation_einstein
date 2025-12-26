const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
// We are importing the model we haven't created yet
const Question = require('../../models/Question'); 

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
      await Question.deleteMany({});
  }
});

describe('Question Model Test', () => {
  it('should create and save a valid question successfully', async () => {
    const validQuestion = new Question({
      text: 'What is 2 + 2?',
      type: 'multiple-choice',
      options: ['3', '4', '5'],
      category: 'Math'
    });
    const savedQuestion = await validQuestion.save();
    
    expect(savedQuestion._id).toBeDefined();
    expect(savedQuestion.text).toBe('What is 2 + 2?');
    expect(savedQuestion.type).toBe('multiple-choice');
    expect(savedQuestion.category).toBe('Math');
  });

  it('should fail to save without required text', async () => {
    const questionWithoutText = new Question({
      type: 'text'
    });
    let err;
    try {
      await questionWithoutText.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.text).toBeDefined();
  });

  it('should fail if type is invalid', async () => {
    const invalidTypeQuestion = new Question({
      text: 'How are you?',
      type: 'invalid-type'
    });
    let err;
    try {
      await invalidTypeQuestion.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.type).toBeDefined();
  });

  it('should fail if type is multiple-choice but options are empty', async () => {
    const invalidMCQuestion = new Question({
      text: 'What is 1 + 1?',
      type: 'multiple-choice',
      options: [] 
    });
    let err;
    try {
      await invalidMCQuestion.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    // We expect an error specifically related to options
    expect(err.errors.options).toBeDefined(); 
  });
});
