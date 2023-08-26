const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('./../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const privacyOptions = [
  'Content-Security-Policy',
  "connect-src 'self' http://localhost:3000 ws://localhost:61363 ws: wss: https://api.mapbox.com https://events.mapbox.com; default-src  https://js.stripe.com/  https://cdnjs.cloudflare.com http://localhost:3000; base-uri 'self' http://localhost:3000;  font-src 'self' https: data:; frame-ancestors 'self'; frame-src 'self' https://js.stripe.com/; img-src 'self' data:; object-src 'none'; script-src  https://js.stripe.com   https://api.mapbox.com 'unsafe-eval' 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.min.js blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;",
];

exports.getCheckoutSession = catchAsync(async (req, res) => {
  //1) get the currently booked tour

  const tour = await Tour.findById(req.params.tourId);

  //2) Create checkout session

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    /*  success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`, */
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });
  //3) Create session as response
  res
    .status(200)
    .set(...privacyOptions)
    .json({
      status: 'success',
      session,
    });
});

/* exports.creatBookingCheckout = catchAsync(async (req, res, next) => {
  //This is only TEMPORARAY BEcause it is unsecure everyone can make bookings without paying
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(`${req.protocol}://${req.get('host')}/`);
});
 */
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email }).id;
  const price = session.line_items[0].price_data.unit_amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`webhook error ${err.message}`);
  }
  if ((event.trype = 'checkout.session.completed')) {
    createBookingCheckout(event.data.object);
  }
  res.status(200).json({ received: true });
};
