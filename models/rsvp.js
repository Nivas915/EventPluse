const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkedIn: { type: Boolean, default: false },
  walkIn: { type: Boolean, default: false },
  rsvpTime: { type: Date, default: Date.now }
});

// Optional: prevent duplicate RSVPs per user-event pair
rsvpSchema.index({ event: 1, attendee: 1 }, { unique: true });

module.exports = mongoose.model('RSVP', rsvpSchema);
