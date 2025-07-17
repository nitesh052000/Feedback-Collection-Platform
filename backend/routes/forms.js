const express = require('express');
const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/forms
// @desc    Create a new form
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('questions').isArray({ min: 1, max: 10 }),
  body('questions.*.text').trim().isLength({ min: 1, max: 500 }),
  body('questions.*.type').isIn(['text', 'multiple-choice']),
  body('questions.*.options').optional().isArray(),
  body('questions.*.required').optional().isBoolean(),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions, settings } = req.body;

    // Validate multiple-choice questions have options
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (question.type === 'multiple-choice' && (!question.options || question.options.length < 2)) {
        return res.status(400).json({ 
          message: `Multiple-choice question "${question.text}" must have at least 2 options` 
        });
      }
      
      // Add order to questions
      question.order = i + 1;
    }

    const form = new Form({
      title,
      description,
      creator: req.user._id,
      questions,
      settings: settings || {}
    });

    await form.save();

    res.status(201).json({
      message: 'Form created successfully',
      form
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forms
// @desc    Get all forms for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = { creator: req.user._id };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const forms = await Form.find(query)
      .populate('responseCount')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Form.countDocuments(query);

    res.json({
      forms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forms/:id
// @desc    Get a specific form by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      creator: req.user._id 
    }).populate('responseCount');

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.json({ form });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forms/:id
// @desc    Update a form
// @access  Private
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('questions').optional().isArray({ min: 1, max: 10 }),
  body('isActive').optional().isBoolean(),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const form = await Form.findOne({ 
      _id: req.params.id, 
      creator: req.user._id 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const { title, description, questions, isActive, settings } = req.body;

    // Update fields
    if (title !== undefined) form.title = title;
    if (description !== undefined) form.description = description;
    if (isActive !== undefined) form.isActive = isActive;
    if (settings !== undefined) form.settings = { ...form.settings, ...settings };

    // Update questions if provided
    if (questions) {
      // Validate multiple-choice questions have options
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (question.type === 'multiple-choice' && (!question.options || question.options.length < 2)) {
          return res.status(400).json({ 
            message: `Multiple-choice question "${question.text}" must have at least 2 options` 
          });
        }
        question.order = i + 1;
      }
      form.questions = questions;
    }

    await form.save();

    res.json({
      message: 'Form updated successfully',
      form
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/forms/:id
// @desc    Delete a form
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      creator: req.user._id 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    await Form.findByIdAndDelete(req.params.id);

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forms/public/:publicUrl
// @desc    Get a form by public URL (no auth required)
// @access  Public
router.get('/public/:publicUrl', async (req, res) => {
  try {
    const form = await Form.findOne({ 
      publicUrl: req.params.publicUrl,
      isActive: true
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found or inactive' });
    }

    res.json({ form });
  } catch (error) {
    console.error('Get public form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 