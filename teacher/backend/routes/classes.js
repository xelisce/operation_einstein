const express = require('express');
const router = express.Router();
const Class = require('../models/Class');

// GET /api/classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/classes/:id
router.get('/:id', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/classes
router.post('/', async (req, res) => {
  const newClass = new Class({
    name: req.body.name,
    grade: req.body.grade
  });

  try {
    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/classes/:id/students
router.post('/:id/students', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    cls.students.push({
      name: req.body.name,
      studentId: req.body.studentId
    });

    await cls.save();
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/classes/:id/simulate-students
router.post('/:id/simulate-students', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const count = req.body.count || 20;
    const startIdx = cls.students.length + 1;

    for (let i = 0; i < count; i++) {
      cls.students.push({
        name: `Student ${startIdx + i}`,
        studentId: `S-${Date.now()}-${i}`
      });
    }

    await cls.save();
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

