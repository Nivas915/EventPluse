const RSVP = require('../models/rsvp');
const Event = require('../models/event');


exports.rsvpEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');

    if (new Date() > new Date(event.rsvpDeadline)) {
      return res.status(400).send('RSVP deadline has passed');
    }

    const existing = await RSVP.findOne({ event: event._id, user: req.user.id });
    if (existing) return res.status(400).send('Already RSVPed');

    const count = await RSVP.countDocuments({ event: event._id });
    if (count >= event.maxAttendees) return res.status(400).send('Max limit reached');

    const rsvp = await RSVP.create({ event: event._id, user: req.user.id });
    res.json(rsvp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const rsvp = await RSVP.findOne({ event: req.params.id, user: req.user.id });
    if (!rsvp) return res.status(404).send('No RSVP found');
    rsvp.checkedIn = true;
    await rsvp.save();
    res.send('Checked in');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEventRSVPs = async (req, res) => {
  try {
    const rsvps = await RSVP.find({ event: req.params.id }).populate('user', 'name email');
    res.json(rsvps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
