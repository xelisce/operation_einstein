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

describe('Class Student Management API', () => {
  let classId;

  beforeEach(async () => {
    const cls = await Class.create({ name: 'Test Class', grade: 1 });
    classId = cls._id;
  });
  
  // POST /api/classes/:id/students
  it('should add a student to the class', async () => {
    const res = await request(app)
      .post(`/api/classes/${classId}/students`)
      .send({
        name: 'John Doe',
        studentId: 'STU-001'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.students).toHaveLength(1);
    expect(res.body.students[0].name).toEqual('John Doe');
  });

  // POST /api/classes/:id/simulate-students
  it('should generate mock students', async () => {
    const res = await request(app)
      .post(`/api/classes/${classId}/simulate-students`)
      .send({ count: 5 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.students).toHaveLength(5);
    // Check if names look generated (optional)
  });
});
