const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const Event = require('../models/event'); // <-- add this
const auth = require('../middleware/authmiddlesware'); // double-check spelling

// POST /events/:id/feedback - Add feedback to an event
router.post('/:id/feedback', auth, async (req, res) => {
  const eventId = req.params.id;
  console.log('User in request:', req.user);  // add this line to check what's inside req.user
  const attendeeId = req.user.id;  // <--- change here from _id to id
  const { comment, emojiReaction } = req.body;

  if (!comment && !emojiReaction) {
    return res.status(400).json({ message: 'Provide comment or emojiReaction' });
  }

  try {
    const feedback = new Feedback({
      event: eventId,
      attendee: attendeeId,
      comment,
      emojiReaction
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error });
  }
});



// GET /events/:id/feedback - Get all feedback for an event
router.get('/:id/feedback', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ event: req.params.id }).populate('attendee', 'name email');
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get feedback', error });
  }
});
// Pin or unpin feedback (host only)
router.patch('/:eventId/feedback/:feedbackId/pin', auth, async (req, res) => {
  try {
    const { eventId, feedbackId } = req.params;
    console.log('User in request:', req.user); 
    const userId = req.user.id;

    // Check if current user is host of the event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.createdBy.equals(userId)) return res.status(403).json({ message: 'Unauthorized' });

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    feedback.pinned = !feedback.pinned; // toggle pin
    await feedback.save();

    res.json({ message: `Feedback ${feedback.pinned ? 'pinned' : 'unpinned'}`, feedback });
  } catch (error) {
    res.status(500).json({ message: 'Failed to pin/unpin feedback', error });
  }
});

// Flag or unflag feedback (host only)
router.patch('/:eventId/feedback/:feedbackId/flag', auth, async (req, res) => {
  try {
    const { eventId, feedbackId } = req.params;
    console.log('User in request:', req.user); 
    const userId = req.user.id;

    // Check if current user is host of the event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.createdBy.equals(userId)) return res.status(403).json({ message: 'Unauthorized' });

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    feedback.flagged = !feedback.flagged; // toggle flag
    await feedback.save();

    res.json({ message: `Feedback ${feedback.flagged ? 'flagged' : 'unflagged'}`, feedback });
  } catch (error) {
    res.status(500).json({ message: 'Failed to flag/unflag feedback', error });
  }
});


module.exports = router;
