const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Response = require('../../models/Response'); // To be created

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
      await Response.deleteMany({});
  }
});

describe('Response Model', () => {
  it('should create a response successfully', async () => {
    const quizId = new mongoose.Types.ObjectId();
    const questionId = new mongoose.Types.ObjectId();
    const studentId = 'anon_student_123'; // Anonymous ID

    const newResponse = new Response({
      quizId: quizId,
      questionId: questionId,
      studentId: studentId,
      answer: "This is the student's answer."
    });

    const savedResponse = await newResponse.save();
    
    expect(savedResponse._id).toBeDefined();
    expect(savedResponse.quizId).toEqual(quizId);
    expect(savedResponse.questionId).toEqual(questionId);
    expect(savedResponse.studentId).toBe(studentId);
    expect(savedResponse.answer).toBe('This is the student\'s answer.');
  });

  it('should fail without a quizId', async () => {
    const invalidResponse = new Response({
      questionId: new mongoose.Types.ObjectId(),
      studentId: 'anon_student_123',
      answer: 'Answer'
    });
    await expect(invalidResponse.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail without a questionId', async () => {
    const invalidResponse = new Response({
      quizId: new mongoose.Types.ObjectId(),
      studentId: 'anon_student_123',
      answer: 'Answer'
    });
    await expect(invalidResponse.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail without a studentId', async () => {
    const invalidResponse = new Response({
      quizId: new mongoose.Types.ObjectId(),
      questionId: new mongoose.Types.ObjectId(),
      answer: 'Answer'
    });
    await expect(invalidResponse.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
  
  it('should fail without an answer', async () => {
    const invalidResponse = new Response({
      quizId: new mongoose.Types.ObjectId(),
      questionId: new mongoose.Types.ObjectId(),
      studentId: 'anon_student_123'
    });
    await expect(invalidResponse.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});
