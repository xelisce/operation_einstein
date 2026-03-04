const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'multiple-choice', 'scale'],
    required: true,
  },
  options: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        // If type is multiple-choice, options array must have at least 1 item
        if (this.type === 'multiple-choice') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Options are required for multiple-choice questions.'
    }
  },
  // Optional correct answer for auto-grading. If not provided,
  // the question is treated as having no answer and students receive full points.
  correctAnswer: {
    type: String,
  },
  // Optional points for the question. Defaults to 1 when not specified.
  points: {
    type: Number,
    default: 1,
  },
  category: {
    type: String,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    // required: true // Strict mode: Uncomment later if we want to enforce all questions belong to a quiz
  },
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
