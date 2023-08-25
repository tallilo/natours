const mongoose = require('mongoose');
const validator = require('validator');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    require: [true, 'Booking must belong to a User!'],
  },
  price: {
    type: Number,
    require: [true, 'booking must have a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({ path: 'Tour', select: 'name' });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
