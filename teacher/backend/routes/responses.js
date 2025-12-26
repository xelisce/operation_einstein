const express = require('express');
const router = express.Router();
const Response = require('../models/Response');

// GET /api/responses
// Optional Query Params: ?quizId=...&studentId=...
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.quizId) filter.quizId = req.query.quizId;
    if (req.query.studentId) filter.studentId = req.query.studentId;

    const responses = await Response.find(filter)
      .populate('questionId', 'text type') // Populate Question text
      .populate('quizId', 'title')         // Populate Quiz title
      .sort({ createdAt: -1 });
      
    res.json(responses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
