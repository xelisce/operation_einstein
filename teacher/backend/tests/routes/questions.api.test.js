const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app'); // We will create this next
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
  await Question.deleteMany({});
});

describe('Question API Routes', () => {
  
  // POST /api/questions
  it('should create a new question', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({
        text: 'What is the capital of France?',
        type: 'multiple-choice',
        options: ['Paris', 'Berlin', 'London'],
        category: 'Geography'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.text).toEqual('What is the capital of France?');
    expect(res.body._id).toBeDefined();
  });

  // GET /api/questions
  it('should fetch all questions', async () => {
    await Question.create({ text: 'Q1', type: 'text' });
    await Question.create({ text: 'Q2', type: 'text' });

    const res = await request(app).get('/api/questions');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(2);
  });
});
