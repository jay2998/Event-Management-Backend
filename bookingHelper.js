const { Booking, BookingItem } = require('./models');
const { Op } = require('sequelize');

/**
 * Verifies if a service is available for a specific time slot.
 */
const checkAvailability = async (serviceId, date, startTime, endTime) => {
  const bookingItems = await BookingItem.findAll({
    include: [{
      model: Booking,
      as: 'booking',
      where: { status: { [Op.in]: ['pending', 'confirmed'] } },
      required: true,
    }],
    where: {
      serviceId,
      slotDate: date,
      [Op.or]: [
        { slotStartTime: { [Op.lt]: endTime, [Op.gte]: startTime } },
        { slotEndTime: { [Op.gt]: startTime, [Op.lte]: endTime } },
      ],
    },
  });

  return bookingItems.length === 0;
};

module.exports = { checkAvailability };
