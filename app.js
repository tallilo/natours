const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const globalErrorHandler = require('./controllers/errorController');
const viewRouter = require('./Routes/viewRoutes');
const AppError = require('./utils/appError');

const cors = require('cors'); // Make sure to install the 'cors' package

const userRouter = require('./Routes/userRoutes');
const tourRouter = require('./Routes/tourRoutes');
const reviewRouter = require('./Routes/reviewRoutes');
const bookingRouter = require('./Routes/bookingRoutes');
const cookieParser = require('cookie-parser');
const compression = require();
const app = express();
// Use the 'cors' middleware to allow requests from a specific origin
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // You may need to set this depending on your application's needs
  }),
);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// serving static fields
app.use(express.static(path.join(__dirname, 'public')));
// 1) global middleware

/// Security HTTP headers
app.use(helmet());
// Development loging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
// LIMIT request from the same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this ip pkease try agin in an hour',
});
app.use('/api', limiter);

//////////////////////
//the budy parser , reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

///Data sanitisation against noSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
app.use(compression());

///// the middleware accure in the order they are in the code

//test middleware
app.use((req, res, next) => {
  req.reqestTime = new Date().toISOString();
  /* console.log('this is the cookie: ', req.cookies); */
  next();
});

///3)Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  /*  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server`,
  }); */
  /* const err = new Error(`Can't find ${req.originalUrl} on this server`);
  err.status = 'fail';
  err.statusCode = 404; */
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
