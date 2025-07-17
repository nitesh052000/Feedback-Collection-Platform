const express = require('express');
const { body, validationResult } = require('express-validator');
const Response = require('../models/Response');
const Form = require('../models/Form');
const { auth } = require('../middleware/auth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const router = express.Router();

// @route   POST /api/responses
// @desc    Submit a response to a form
// @access  Public
router.post('/', [
  body('formId').isMongoId(),
  body('answers').isArray({ min: 1 }),
  body('answers.*.questionId').isMongoId(),
  body('answers.*.answer').notEmpty(),
  body('submitterEmail').optional().isEmail().normalizeEmail(),
  body('submitterName').optional().trim().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { formId, answers, submitterEmail, submitterName } = req.body;

    // Get the form
    const form = await Form.findById(formId);
    if (!form || !form.isActive) {
      return res.status(404).json({ message: 'Form not found or inactive' });
    }

    // Validate answers match form questions
    if (answers.length !== form.questions.length) {
      return res.status(400).json({ message: 'Number of answers does not match number of questions' });
    }

    // Validate required questions are answered
    for (let i = 0; i < form.questions.length; i++) {
      const question = form.questions[i];
      const answer = answers.find(a => a.questionId.toString() === question._id.toString());
      
      if (!answer && question.required) {
        return res.status(400).json({ 
          message: `Required question "${question.text}" is not answered` 
        });
      }
    }

    // Validate multiple-choice answers
    for (const answer of answers) {
      const question = form.questions.find(q => q._id.toString() === answer.questionId.toString());
      if (question && question.type === 'multiple-choice') {
        if (!question.options.includes(answer.answer)) {
          return res.status(400).json({ 
            message: `Invalid option for question "${question.text}"` 
          });
        }
      }
    }

    // Check if multiple responses are allowed
    if (!form.settings.allowMultipleResponses) {
      const existingResponse = await Response.findOne({ 
        form: formId, 
        submitterEmail: submitterEmail || req.ip 
      });
      
      if (existingResponse) {
        return res.status(400).json({ message: 'You have already submitted a response to this form' });
      }
    }

    // Create response with metadata
    const response = new Response({
      form: formId,
      answers: answers.map(answer => {
        const question = form.questions.find(q => q._id.toString() === answer.questionId.toString());
        return {
          questionId: answer.questionId,
          questionText: question.text,
          questionType: question.type,
          answer: answer.answer
        };
      }),
      submitterEmail,
      submitterName,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await response.save();

    res.status(201).json({
      message: 'Response submitted successfully',
      responseId: response._id
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/responses/form/:formId
// @desc    Get all responses for a specific form (admin only)
// @access  Private
router.get('/form/:formId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Verify form belongs to user
    const form = await Form.findOne({ 
      _id: req.params.formId, 
      creator: req.user._id 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const responses = await Response.find({ form: req.params.formId })
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Response.countDocuments({ form: req.params.formId });

    res.json({
      responses,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/responses/form/:formId/summary
// @desc    Get summary statistics for a form (admin only)
// @access  Private
router.get('/form/:formId/summary', auth, async (req, res) => {
  try {
    // Verify form belongs to user
    const form = await Form.findOne({ 
      _id: req.params.formId, 
      creator: req.user._id 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const totalResponses = await Response.countDocuments({ form: req.params.formId });
    
    // Get responses for analysis
    const responses = await Response.find({ form: req.params.formId });
    
    // Calculate summary statistics
    const summary = {
      totalResponses,
      questions: []
    };

    // Analyze each question
    for (const question of form.questions) {
      const questionSummary = {
        questionId: question._id,
        questionText: question.text,
        questionType: question.type,
        totalAnswers: 0,
        answers: {}
      };

      // Count answers for this question
      for (const response of responses) {
        const answer = response.answers.find(a => a.questionId.toString() === question._id.toString());
        if (answer) {
          questionSummary.totalAnswers++;
          
          if (question.type === 'multiple-choice') {
            questionSummary.answers[answer.answer] = (questionSummary.answers[answer.answer] || 0) + 1;
          }
        }
      }

      summary.questions.push(questionSummary);
    }

    res.json({ summary });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/responses/form/:formId/export
// @desc    Export responses as CSV (admin only)
// @access  Private
router.get('/form/:formId/export', auth, async (req, res) => {
  try {
    // Verify form belongs to user
    const form = await Form.findOne({ 
      _id: req.params.formId, 
      creator: req.user._id 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const responses = await Response.find({ form: req.params.formId })
      .sort({ submittedAt: -1 });

    if (responses.length === 0) {
      return res.status(404).json({ message: 'No responses to export' });
    }

    // Prepare CSV data
    const csvData = [];
    
    for (const response of responses) {
      const row = {
        'Response ID': response._id,
        'Submitted At': response.submittedAt.toISOString(),
        'Submitter Email': response.submitterEmail || '',
        'Submitter Name': response.submitterName || '',
        'IP Address': response.ipAddress || ''
      };

      // Add answers
      for (const answer of response.answers) {
        row[`Q${answer.questionText}`] = answer.answer;
      }

      csvData.push(row);
    }

    // Set up CSV writer
    const csvWriter = createCsvWriter({
      path: `./temp/${form.title}-responses-${Date.now()}.csv`,
      header: Object.keys(csvData[0]).map(key => ({ id: key, title: key }))
    });

    await csvWriter.writeRecords(csvData);

    // Send file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${form.title}-responses.csv"`);
    
    // Read and send the file
    const fs = require('fs');
    const filePath = `./temp/${form.title}-responses-${Date.now()}.csv`;
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Clean up file after sending
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/responses/:id
// @desc    Get a specific response (admin only)
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const response = await Response.findById(req.params.id)
      .populate('form', 'title creator');

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Verify form belongs to user
    if (response.form.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ response });
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 