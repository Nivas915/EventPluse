const Event = require('../models/event');
const RSVP = require('../models/rsvp');
const User = require('../models/user');
const sendMail = require('../controllers/email');

// Create new event (host only)
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      timezone,
      locationPhysical,
      locationVirtual,
      rsvpDeadline,
      maxAttendees
    } = req.body;

    if (!title || !date || !timezone || !rsvpDeadline || !maxAttendees) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      timezone,
      locationPhysical,
      locationVirtual,
      rsvpDeadline,
      maxAttendees,
      createdBy: req.user.id
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all events created by the host
exports.getMyEvents = async (req, res) => {
  if (req.user.role !== 'host') return res.status(403).json({ message: 'Only hosts can view their events' });

  try {
    const events = await Event.find({ createdBy: req.user.id });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get event details (host or attendee who RSVP'd)
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role === 'host' && event.createdBy.toString() === req.user.id) {
      return res.json(event);
    }

    if (req.user.role === 'attendee') {
      const rsvp = await RSVP.findOne({ event: event._id, user: req.user.id });
      if (!rsvp) return res.status(403).json({ message: 'Access denied' });
      return res.json(event);
    }

    return res.status(403).json({ message: 'Access denied' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update event status (host only)
exports.updateEventStatus = async (req, res) => {
  if (req.user.role !== 'host') return res.status(403).json({ message: 'Only hosts can update event status' });

  const { status } = req.body;
  if (!['Scheduled', 'Live', 'Closed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    event.status = status;
    await event.save();
    res.json(event);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// RSVP to an event (attendee only, before deadline and max capacity)
exports.rsvpEvent = async (req, res) => {
  if (req.user.role !== 'attendee') return res.status(403).json({ message: 'Only attendees can RSVP' });

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check RSVP deadline
    if (new Date() > new Date(event.rsvpDeadline)) {
      return res.status(400).json({ message: 'RSVP deadline passed' });
    }

    // Check max attendees limit
    const rsvpCount = await RSVP.countDocuments({ event: event._id });
    if (event.maxAttendees && rsvpCount >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

   const rsvp = new RSVP({
      event: event._id,
      attendee: req.user.id,
      checkedIn: false
    });
    await rsvp.save();

    // Fetch attendee details
    const user = await User.findById(req.user.id);
    if (user && user.email) {
      await sendMail(
        user.email,
        `RSVP Confirmed for ${event.title}`,
        `Hi ${user.name},\n\nYou're successfully registered for "${event.title}".\n\n📍 Location: ${event.location}\n📅 Date: ${event.date}\n\nThank you for registering!`
      );
    }

    res.json({ message: 'RSVP confirmed and email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Check-in attendee (host only, on event day, time-gated)
exports.checkIn = async (req, res) => {
  if (req.user.role !== 'host') {
    return res.status(403).json({ message: 'Only hosts can check-in attendees' });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow check-in on event day
    const now = new Date();
    const eventDate = new Date(event.date);
    if (now.toDateString() !== eventDate.toDateString()) {
      return res.status(400).json({ message: 'Check-in only allowed on event day' });
    }

    const { attendeeEmail } = req.body;
    if (!attendeeEmail) return res.status(400).json({ message: 'Attendee email is required' });

    const user = await User.findOne({ email: attendeeEmail });
    if (!user) return res.status(404).json({ message: 'Attendee not found with that email' });

    let rsvp = await RSVP.findOne({ event: event._id, attendee: user._id });

    if (!rsvp) {
      // Walk-in attendee
      rsvp = new RSVP({
        event: event._id,
        attendee: user._id,
        checkedIn: true,
        walkIn: true
      });
      await rsvp.save();

      await sendMail(
        user.email,
        `Checked in for ${event.title}`,
        `Hi ${user.name},\n\nYou've been successfully checked in as a walk-in attendee for "${event.title}".\n\nThanks for joining us today!`
      );

      return res.json({ message: 'Walk-in checked in and email sent' });
    }
if (rsvp.checkedIn) {
  await sendMail(user.email, `Re-check in for ${event.title}`, `Hi ${user.name},\n\nYou have been checked in again for "${event.title}".`);
  return res.json({ message: 'Already checked in before, but mail sent again' });
}


    rsvp.checkedIn = true;
    await rsvp.save();

    await sendMail(
      user.email,
      `Checked in for ${event.title}`,
      `Hi ${user.name},\n\nYou've been successfully checked in for "${event.title}".\n\nEnjoy the event!`
    );

    return res.json({ message: 'Checked in successfully and email sent' });

  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all RSVPs for an event (host only)
exports.getEventRSVPs = async (req, res) => {
  if (req.user.role !== 'host') return res.status(403).json({ message: 'Only hosts can view RSVPs' });

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    console.log('Fetched event:', event);

    if (!event.createdBy || event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const rsvps = await RSVP.find({ event: event._id }).populate('attendee', 'name email');
    res.json(rsvps);

  } catch (err) {
    console.error('getEventRSVPs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllPendingEvents = async (req, res) => {
  try {
    const pendingEvents = await Event.find({ status: 'Scheduled' });
    res.status(200).json(pendingEvents);
  } catch (err) {
    console.error('Error fetching pending events:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
// GET /api/events/my
exports.getRSVPEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all RSVPs for this user
    const rsvps = await RSVP.find({ attendee: userId }).populate('event');

    // Extract event details
    const events = rsvps.map(rsvp => ({
      id: rsvp.event._id,
      title: rsvp.event.title,
      description: rsvp.event.description,
      date: rsvp.event.date,
      location: rsvp.event.location,
      status: rsvp.event.status,
      isRSVPed: true,  // obviously true since user RSVPed
      isCheckedIn: rsvp.checkedIn,
    }));

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

