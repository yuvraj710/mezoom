const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { query } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createMeetingSchema = Joi.object({
  title: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  isPrivate: Joi.boolean().optional()
});

const joinMeetingSchema = Joi.object({
  meetingId: Joi.string().required()
});

// Create a new meeting
router.post('/create', optionalAuth, async (req, res) => {
  try {
    const { error, value } = createMeetingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description, isPrivate = false } = value;
    const meetingId = uuidv4().replace(/-/g, '').substring(0, 12);
    const creatorId = req.user ? req.user.id : null;

    // Insert meeting into database
    const result = await query(
      `INSERT INTO meetings (id, title, description, creator_id, is_private, created_at, status) 
       VALUES ($1, $2, $3, $4, $5, NOW(), 'active') 
       RETURNING id, title, description, creator_id, is_private, created_at, status`,
      [meetingId, title || 'Untitled Meeting', description, creatorId, isPrivate]
    );

    const meeting = result.rows[0];

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        isPrivate: meeting.is_private,
        created_at: meeting.created_at,
        status: meeting.status,
        joinUrl: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/meeting/${meeting.id}`
      }
    });
  } catch (error) {
    console.error('Meeting creation error:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Get meeting details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT m.*, u.username as creator_username 
       FROM meetings m 
       LEFT JOIN users u ON m.creator_id = u.id 
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = result.rows[0];

    // Check if meeting is private and user has access
    if (meeting.is_private && (!req.user || req.user.id !== meeting.creator_id)) {
      return res.status(403).json({ error: 'Access denied to private meeting' });
    }

    res.json({
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        isPrivate: meeting.is_private,
        creator: meeting.creator_username,
        created_at: meeting.created_at,
        status: meeting.status,
        joinUrl: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/meeting/${meeting.id}`
      }
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ error: 'Failed to get meeting details' });
  }
});

// Join meeting (validate access)
router.post('/:id/join', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = joinMeetingSchema.validate({ meetingId: id });
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await query(
      `SELECT m.*, u.username as creator_username 
       FROM meetings m 
       LEFT JOIN users u ON m.creator_id = u.id 
       WHERE m.id = $1 AND m.status = 'active'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found or not active' });
    }

    const meeting = result.rows[0];

    // Check if meeting is private and user has access
    if (meeting.is_private && (!req.user || req.user.id !== meeting.creator_id)) {
      return res.status(403).json({ error: 'Access denied to private meeting' });
    }

    // Log meeting join (optional - for analytics)
    if (req.user) {
      await query(
        'INSERT INTO meeting_participants (meeting_id, user_id, joined_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
        [id, req.user.id]
      );
    }

    res.json({
      message: 'Successfully joined meeting',
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        isPrivate: meeting.is_private,
        creator: meeting.creator_username,
        created_at: meeting.created_at,
        status: meeting.status
      }
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// End meeting
router.post('/:id/end', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM meetings WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = result.rows[0];

    // Only creator can end the meeting
    if (req.user && req.user.id !== meeting.creator_id) {
      return res.status(403).json({ error: 'Only meeting creator can end the meeting' });
    }

    // Update meeting status
    await query(
      'UPDATE meetings SET status = $1, ended_at = NOW() WHERE id = $2',
      ['ended', id]
    );

    res.json({ message: 'Meeting ended successfully' });
  } catch (error) {
    console.error('End meeting error:', error);
    res.status(500).json({ error: 'Failed to end meeting' });
  }
});

// Get user's meetings
router.get('/user/my-meetings', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await query(
      `SELECT id, title, description, is_private, created_at, status, ended_at
       FROM meetings 
       WHERE creator_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    const meetings = result.rows.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      isPrivate: meeting.is_private,
      created_at: meeting.created_at,
      status: meeting.status,
      ended_at: meeting.ended_at,
      joinUrl: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/meeting/${meeting.id}`
    }));

    res.json({ meetings });
  } catch (error) {
    console.error('Get user meetings error:', error);
    res.status(500).json({ error: 'Failed to get user meetings' });
  }
});

module.exports = router;
