const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const Quiz = require('../../models/Quiz');
const Class = require('../../models/Class');
const Question = require('../../models/Question');
const Response = require('../../models/Response');

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
  await Quiz.deleteMany({});
  await Class.deleteMany({});
  await Question.deleteMany({});
  await Response.deleteMany({});
});

describe('Quiz Simulation API', () => {
  it('should generate responses for all students', async () => {
    // 1. Setup Class with Students
    const cls = await Class.create({
      name: 'Sim Class',
      students: [{ name: 'S1', studentId: '1' }, { name: 'S2', studentId: '2' }]
    });

    // 2. Setup Quiz
    const quiz = await Quiz.create({ title: 'Sim Quiz', classId: cls._id });

    // 3. Setup Questions
    await Question.create({ text: 'Q1', type: 'text', quizId: quiz._id });
    await Question.create({ text: 'Q2', type: 'multiple-choice', options: ['A','B'], quizId: quiz._id });

    // 4. Call Simulate
    const res = await request(app).post(`/api/quizzes/${quiz._id}/simulate`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.count).toEqual(4); // 2 Students * 2 Questions

    // 5. Verify DB
    const count = await Response.countDocuments();
    expect(count).toEqual(4);
  });
});
