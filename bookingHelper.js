const Booking = require('./models/Booking');

/**
 * Verifies if a service is available for a specific time slot.
 * @param {String} serviceId - The ID of the service (Hall, Vehicle, etc.)
 * @param {Date} date - The date of the event
 * @param {String} startTime - The start time (HH:mm)
 * @param {String} endTime - The end time (HH:mm)
 * @param {import('mongoose').ClientSession} [session] - Optional session for transactions
 */
const checkAvailability = async (serviceId, date, startTime, endTime, session = null) => {
  const existingBooking = await Booking.findOne({
    'items.serviceId': serviceId,
    'items.slotDate': new Date(date),
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { 'items.slotStartTime': { $lt: endTime, $gte: startTime } },
      { 'items.slotEndTime': { $gt: startTime, $lte: endTime } }
    ]
  }).session(session);

  return !existingBooking;
};

module.exports = { checkAvailability };