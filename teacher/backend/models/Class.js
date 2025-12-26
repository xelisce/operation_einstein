const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  grade: {
    type: Number,
  },
  students: [{
    name: String,
    studentId: String, // e.g. "S-101"
  }],
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
