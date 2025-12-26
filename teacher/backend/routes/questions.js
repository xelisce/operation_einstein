const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// GET /api/questions
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.quizId) filter.quizId = req.query.quizId;

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/questions
router.post('/', async (req, res) => {
  const question = new Question({
    text: req.body.text,
    type: req.body.type,
    options: req.body.options,
    category: req.body.category,
    quizId: req.body.quizId
  });

  try {
    const newQuestion = await question.save();
    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
