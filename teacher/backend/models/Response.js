const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  studentId: { // Anonymous ID for the student/beneficiary
    type: String,
    required: true,
  },
  answer: { // Student's response text
    type: String,
    required: true,
  },
  score: { // Optional: for auto-graded questions
    type: Number,
  },
}, { timestamps: true });

module.exports = mongoose.model('Response', ResponseSchema);
