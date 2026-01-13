const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Class = require('../../models/Class'); // To be created
const Quiz = require('../../models/Quiz');   // To be created

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
      await Class.deleteMany({});
      await Quiz.deleteMany({});
  }
});

describe('Class Model', () => {
  it('should create a class successfully', async () => {
    const newClass = new Class({ name: 'Math 101', grade: 5 });
    const savedClass = await newClass.save();
    
    expect(savedClass._id).toBeDefined();
    expect(savedClass.name).toBe('Math 101');
    expect(savedClass.grade).toBe(5);
  });

  it('should fail without a name', async () => {
    const invalidClass = new Class({ grade: 5 });
    await expect(invalidClass.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe('Quiz Model', () => {
  it('should create a quiz linked to a class and questions', async () => {
    // 1. Create a dummy Class ID (using mongoose.Types.ObjectId)
    const classId = new mongoose.Types.ObjectId();
    const questionId = new mongoose.Types.ObjectId();

    const newQuiz = new Quiz({
      title: 'Midterm Exam',
      description: 'First half assessment',
      classId: classId,
      questions: [questionId]
    });

    const savedQuiz = await newQuiz.save();

    expect(savedQuiz._id).toBeDefined();
    expect(savedQuiz.title).toBe('Midterm Exam');
    expect(savedQuiz.classId).toEqual(classId);
    expect(savedQuiz.questions).toContain(questionId);
  });

  it('should require a title', async () => {
    const invalidQuiz = new Quiz({ description: 'No Title' });
    await expect(invalidQuiz.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});
