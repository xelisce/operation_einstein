const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
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
  await Class.deleteMany({});
});

describe('Class API Routes', () => {
  
  // POST /api/classes
  it('should create a new class', async () => {
    const res = await request(app)
      .post('/api/classes')
      .send({
        name: 'Math 101',
        grade: 5
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual('Math 101');
    expect(res.body._id).toBeDefined();
  });

  // GET /api/classes
  it('should fetch all classes', async () => {
    await Class.create({ name: 'Science' });
    await Class.create({ name: 'History' });

    const res = await request(app).get('/api/classes');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(2);
  });
});
