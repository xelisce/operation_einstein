const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Class = require('../models/Class');
const Question = require('../models/Question');
const Response = require('../models/Response');

// POST /api/quizzes/:id/simulate
router.post('/:id/simulate', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const cls = await Class.findById(quiz.classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const questions = await Question.find({ quizId: quiz._id });
    if (questions.length === 0) return res.status(400).json({ message: 'No questions in quiz' });

    const responsesToSave = [];

    // Clear existing responses for this quiz to avoid duplicates/mess
    await Response.deleteMany({ quizId: quiz._id });

    for (const student of cls.students) {
      for (const q of questions) {
        let answer = '';
        if (q.type === 'multiple-choice' && q.options.length > 0) {
          const randIdx = Math.floor(Math.random() * q.options.length);
          answer = q.options[randIdx];
        } else if (q.type === 'scale') {
          answer = Math.floor(Math.random() * 5 + 1).toString();
        } else {
          const sampleTexts = ['Good', 'Average', 'Needs Improvement', 'Excellent', 'N/A'];
          answer = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        }

        responsesToSave.push({
          quizId: quiz._id,
          questionId: q._id,
          studentId: student.studentId,
          answer: answer
        });
      }
    }

    await Response.insertMany(responsesToSave);
    res.json({ message: 'Simulation complete', count: responsesToSave.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/quizzes?classId=...
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.classId = req.query.classId;

    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/quizzes
router.post('/', async (req, res) => {
  const quiz = new Quiz({
    title: req.body.title,
    description: req.body.description,
    classId: req.body.classId
  });

  try {
    const newQuiz = await quiz.save();
    res.status(201).json(newQuiz);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
