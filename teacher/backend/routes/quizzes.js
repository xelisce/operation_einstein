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

// GET /api/quizzes/:id/scores
// Returns array of { studentId, total } and overall maxScore
router.get('/:id/scores', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const cls = await Class.findById(quiz.classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const questions = await Question.find({ quizId: quiz._id });
    if (questions.length === 0) return res.status(400).json({ message: 'No questions in quiz' });

    // Fetch all responses for this quiz, newest-first
    const responses = await Response.find({ quizId: quiz._id }).sort({ createdAt: -1 });

    // Map of latest responses per studentId -> questionId
    const latest = {}; // { studentId: { questionIdStr: response } }
    for (const r of responses) {
      const studentMap = latest[r.studentId] || (latest[r.studentId] = {});
      const qid = r.questionId.toString();
      if (!studentMap[qid]) {
        studentMap[qid] = r; // first (newest) wins
      }
    }

    // Compute maxScore and per-question points
    let maxScore = 0;
    const qPoints = {};
    for (const q of questions) {
      const p = (typeof q.points === 'number') ? q.points : 0;
      qPoints[q._id.toString()] = p;
      maxScore += p;
    }

    // Helper normalizer
    const normalize = s => (s || '').toString().trim().toLowerCase();

    const results = [];
    for (const student of cls.students) {
      let total = 0;
      const studentResponses = latest[student.studentId] || {};

      for (const q of questions) {
        const qid = q._id.toString();
        const p = qPoints[qid] || 0;

        // If question has no correctAnswer configured -> award full points
        if (!q.correctAnswer) {
          total += p;
          continue;
        }

        const resp = studentResponses[qid];
        if (!resp) {
          // No response from student for this question -> zero
          continue;
        }

        // Compare based on type where useful, otherwise string compare
        let correct = false;
        if (q.type === 'scale') {
          correct = Number(resp.answer) === Number(q.correctAnswer);
        } else {
          correct = normalize(resp.answer) === normalize(q.correctAnswer);
        }

        if (correct) total += p;
      }

      results.push({ studentId: student.studentId, total });
    }

    res.json({ results, maxScore });
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
