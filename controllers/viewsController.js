const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const privacyOptions = [
  'Content-Security-Policy',
  "connect-src 'self' http://localhost:3000 ws://localhost:61363 ws: wss: https://api.mapbox.com https://events.mapbox.com; default-src https://js.stripe.com/ https://cdnjs.cloudflare.com http://localhost:3000; base-uri 'self' http://localhost:3000;  font-src 'self' https: data:; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; frame-src 'self' https://js.stripe.com/; script-src   https://js.stripe.com  https://api.mapbox.com 'unsafe-eval' 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.min.js blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;",
];

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) Get tour data from collection
  const tours = await Tour.find({});
  //2) Build template
  //console.log(tours);
  //3) Render that template using tour dta from 1
  res
    .status(200)
    .set(...privacyOptions)
    .render('overview', {
      title: 'All tours',
      tours,
    });
});
exports.getLoginForm = catchAsync(async (req, res, next) => {
  //3) Render that template using tour dta from 1
  res
    .status(200)
    .set(...privacyOptions)
    .render('login', {
      title: 'Log into your account',
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  ///1) Get the data for requested tour (including reviews and guides )
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) return next(new AppError('there is no tour with that name', 404));
  //2) build template
  //console.log(tour);
  //3) render template using the data from 1
  res
    .status(200)
    .set(...privacyOptions)
    .render('tour', {
      title: `${tour.name} tour`,
      tour,
    });
});

exports.privateOption = privacyOptions;
exports.getAccount = (req, res) => {
  res
    .status(200)
    .set(...privacyOptions)
    .render('account', {
      title: `Your account`,
    });
};
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUserData = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res
    .status(200)
    .set(...privacyOptions)
    .render('account', {
      title: `Your account`,
      user: updatedUserData,
    });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  //2) Find tours with the returend IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', { tours, title: 'My Tours' });
});
