const mongoose = require('mongoose');
const softDeletePlugin = require('../middlewares/softDelete');
const { serviceBaseSchema } = require('./ServiceBase');

// Base model used for discriminators.
serviceBaseSchema.plugin(softDeletePlugin);

const Service = mongoose.model('Service', serviceBaseSchema);

module.exports = Service;


