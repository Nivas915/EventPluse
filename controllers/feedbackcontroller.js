const Feedback = require('../models/feedback');
const Event = require('../models/event');

exports.submitFeedback = async (req, res) => {
  try {
    const { comment, emojiReaction } = req.body;
    if (!comment && !emojiReaction) {
      return res.status(400).json({ message: 'Provide comment or emojiReaction' });
    }

    const feedback = await Feedback.create({
      attendee: req.user._id,
      event: req.params.id,
      comment,
      emojiReaction
    });
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ event: req.params.id })
      .populate('attendee', 'name email')
      .sort('-createdAt');
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.togglePinFeedback = async (req, res) => {
  try {
    const { eventId, feedbackId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.createdBy.equals(userId)) return res.status(403).json({ message: 'Unauthorized' });

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    feedback.pinned = !feedback.pinned;
    await feedback.save();

    res.json({ message: `Feedback ${feedback.pinned ? 'pinned' : 'unpinned'}`, feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleFlagFeedback = async (req, res) => {
  try {
    const { eventId, feedbackId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.createdBy.equals(userId)) return res.status(403).json({ message: 'Unauthorized' });

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    feedback.flagged = !feedback.flagged;
    await feedback.save();

    res.json({ message: `Feedback ${feedback.flagged ? 'flagged' : 'unflagged'}`, feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
