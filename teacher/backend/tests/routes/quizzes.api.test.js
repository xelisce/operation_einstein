const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const Quiz = require('../../models/Quiz');
const Class = require('../../models/Class');

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
});

describe('Quiz API Routes', () => {
  let classId;

  beforeEach(async () => {
    const cls = await Class.create({ name: 'Math 101' });
    classId = cls._id;
  });

  // POST /api/quizzes
  it('should create a new quiz linked to a class', async () => {
    const res = await request(app)
      .post('/api/quizzes')
      .send({
        title: 'Midterm',
        classId: classId
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.title).toEqual('Midterm');
    expect(res.body.classId).toEqual(classId.toString());
  });

  // GET /api/quizzes?classId=...
  it('should fetch quizzes for a specific class', async () => {
    await Quiz.create({ title: 'Q1', classId });
    await Quiz.create({ title: 'Q2', classId });
    
    // Create a quiz for another class
    const otherClassId = new mongoose.Types.ObjectId();
    await Quiz.create({ title: 'Other', classId: otherClassId });

    const res = await request(app).get(`/api/quizzes?classId=${classId}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(2);
  });
});
