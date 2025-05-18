const express = require('express');
const router = express.Router();
const auth = require('../middleware/authmiddlesware');

const {
  createEvent,
  getMyEvents,
  getAllPendingEvents,
  getEventById,
  updateEventStatus,
  rsvpEvent,
  checkIn,
  getEventRSVPs,
  getRSVPEvents
,
} = require('../controllers/eventcontroller');
const { route } = require('./auth');

router.post('/', auth, createEvent);
router.get('/', auth, getMyEvents);
router.get('/all',auth, getAllPendingEvents);

router.get('/events-mine', auth, getRSVPEvents);
router.get('/:id', auth, getEventById);
router.patch('/:id/status', auth, updateEventStatus);

router.post('/:id/rsvp', auth, rsvpEvent);
router.post('/:id/checkin', auth, checkIn);
router.get('/:id/rsvps', auth, getEventRSVPs);

module.exports = router;
