const User = require('./User');
const Service = require('./Service');
const Booking = require('./Booking');
const BookingItem = require('./BookingItem');
const BookingMenuItem = require('./BookingMenuItem');
const PaymentHistory = require('./PaymentHistory');
const Inventory = require('./Inventory');
const Notification = require('./Notification');
const Availability = require('./Availability');
const MenuDraft = require('./MenuDraft');
const MenuDraftItem = require('./MenuDraftItem');

// User associations
User.hasMany(Service, { foreignKey: 'vendorId', as: 'services' });
Service.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

User.hasMany(Booking, { foreignKey: 'customerId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(MenuDraft, { foreignKey: 'userId', as: 'menuDrafts' });
MenuDraft.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Inventory, { foreignKey: 'vendorId', as: 'inventory' });
Inventory.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

// Service associations
Service.hasMany(Booking, { foreignKey: 'hall', as: 'hallBookings' });
Booking.belongsTo(Service, { foreignKey: 'hall', as: 'hallService' });

// Booking associations
Booking.hasMany(BookingItem, { foreignKey: 'bookingId', as: 'items', onDelete: 'CASCADE' });
BookingItem.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

BookingItem.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
Service.hasMany(BookingItem, { foreignKey: 'serviceId', as: 'bookingItems' });

Booking.hasMany(BookingMenuItem, { foreignKey: 'bookingId', as: 'menuItems', onDelete: 'CASCADE' });
BookingMenuItem.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

Booking.hasMany(PaymentHistory, { foreignKey: 'bookingId', as: 'paymentHistory', onDelete: 'CASCADE' });
PaymentHistory.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

Booking.hasMany(Availability, { foreignKey: 'bookingId', as: 'availabilities' });
Availability.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// MenuDraft associations
MenuDraft.hasMany(MenuDraftItem, { foreignKey: 'menuDraftId', as: 'items', onDelete: 'CASCADE' });
MenuDraftItem.belongsTo(MenuDraft, { foreignKey: 'menuDraftId', as: 'menuDraft' });

MenuDraft.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Booking.hasMany(MenuDraft, { foreignKey: 'bookingId', as: 'menuDrafts' });

module.exports = {
  User,
  Service,
  Booking,
  BookingItem,
  BookingMenuItem,
  PaymentHistory,
  Inventory,
  Notification,
  Availability,
  MenuDraft,
  MenuDraftItem,
};
