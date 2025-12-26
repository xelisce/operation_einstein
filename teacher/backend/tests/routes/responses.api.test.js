const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const Response = require('../../models/Response');
const Quiz = require('../../models/Quiz');
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

beforeEach(async () => {
  await Response.deleteMany({});
  await Quiz.deleteMany({});
  await Question.deleteMany({});
});

describe('Response API Routes', () => {
  it('should fetch responses for a specific quiz', async () => {
    // Setup Data
    const question = await Question.create({ text: 'Q1', type: 'text' });
    const quiz = await Quiz.create({ title: 'Quiz 1' });
    
    await Response.create({
      quizId: quiz._id,
      questionId: question._id,
      studentId: 'student_1',
      answer: 'Answer 1'
    });
    
    await Response.create({
      quizId: quiz._id,
      questionId: question._id,
      studentId: 'student_2',
      answer: 'Answer 2'
    });

    // Execute
    const res = await request(app).get(`/api/responses?quizId=${quiz._id}`);
    
    // Verify
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(2);
    expect(res.body[0].answer).toBeDefined();
    // Check populating (optional, but good practice)
    // expect(res.body[0].questionId.text).toBe('Q1'); 
  });
});
