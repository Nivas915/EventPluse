const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String },
  emojiReaction: { 
    type: String,
    required: false 
  },
  pinned: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
