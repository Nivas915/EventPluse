const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true }, // Store in UTC
  timezone: { type: String, required: true }, // e.g., "America/New_York"
  locationPhysical: { type: String }, // For physical location
  locationVirtual: { type: String },  // For virtual URL
  rsvpDeadline: { type: Date, required: true },
  maxAttendees: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Scheduled', 'Live', 'Closed'], default: 'Scheduled' }
}, { timestamps: true });

eventSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Event', eventSchema);
