const AppError = require('./../utils/appError');
const { privateOption } = require('./viewsController');
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((value) => value.message);

  const message = errors.join('. ');
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value:${value} please use another value`;
  return new AppError(message, 400);
};
const handleJwtExpireError = (err) =>
  new AppError('Your token has expired please log in again', 401);
const handleJwtError = (err) =>
  new AppError('Invalid token . please login again', 401);

const handleCastErrorDb = (err) => {
  const message = ` Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // api
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } // rendered website
  else {
    res
      .status(err.statusCode)
      .set(...privateOption)
      .render('error', {
        title: 'Something went wrong',
        msg: err.message,
      });
  }
};
const sendErrorProd = (err, req, res) => {
  ///OPerational , trusted error: send message to the client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational === true) {
      console.log('the error message is:', err.message);
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    ///programing or other unknow error dont leak error details

    //1)log error
    console.log('i am in the unrecognize errors!');
    console.error('Error ', err);
    //2)send a generic message
    return res.status(500).json({
      status: 'error',
      message: 'something went very wrong!',
    });
  } // for the render website

  if (err.isOperational === true) {
    console.log(' i am in the operational rendered');
    return res
      .status(err.statusCode)
      .set(...privateOption)
      .render('error', {
        title: 'Something went wrong',
        msg: err.message,
      });
  }
  ///programing or other unknow error dont leak error details
  //1)log error
  console.log('i am in the unrecognize errors!');
  console.error('Error ', err);

  //2)send a generic message
  console.log(' i am in the unknow rendered');
  return res
    .status(err.statusCode)
    .set(...privateOption)
    .render('error', {
      title: 'Something went wrong',
      msg: 'Please try again later',
    });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    console.log(err.name);
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    console.log('the error message is:', err.message);
    if (err.name === 'CastError') {
      err = handleCastErrorDb(error);
    }

    if (err.code === 11000) {
      err = handleDuplicateFieldsDB(err);
    }
    if (err.name === 'ValidationError') {
      err = handleValidationErrorDB(err);
    }
    if (err.name === 'JsonWebTokenError') err = handleJwtError;
    if (err.name === 'TokenExpiredError') err = handleJwtExpireError(err);

    sendErrorProd(err, req, res);
  }
};
