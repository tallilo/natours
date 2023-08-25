const { promisify } = require('util');
const crypto = require('crypto');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 1000 * 60 * 60 * 24,
    ),
    secure: false, // No HTTPS
    path: '/',
    httpOnly: true,
    sameSite: 'Lax', // Set SameSite attribute to Lax
    sameSite: 'Lax',
  };
  ///// need to be uncomment when we go to production!
  /*  if(process.env.NODE_ENV ==='production')cookieOptions.secure=true; */

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcom();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  ///1) check if email and password exist
  if (!email || !password) {
    console.log('here');
    return next(new AppError('Please provide email and password', 400));
  }

  //2) check if user exists && password is corrent
  const user = await User.findOne({ email }).select('+password');
  const correct = await user?.correctPassword(password, user.password);
  if (!user || !correct) {
    console.log('here');
    return next(new AppError('Incorrect email or password', 401));
  }

  //3) if everything ok send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  ///1) get tocken and check if it there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged in Please log in to get access', 401),
    );
  }
  //2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);

  //3) check if user is still exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The user belong to the token doesn not exist'));
  }
  console.log('user still exist');
  //4) check if user change pasword after gwt was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! please log in again', 401),
    );
  }
  console.log('password didnt changed!');
  /// grant access to protected route
  req.user = freshUser;
  console.log('1');
  res.locals.user = freshUser;
  console.log('2');
  next();
});

//Only for rendered pages , no errors!
exports.isLoggedIn = async (req, res, next) => {
  let token;
  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;

      //1) verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      //2) check if user is still exist
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      //3) check if user change pasword after gwt was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      /// there is a logged in user!
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles  ['admin','lead-gude'] , role= "user"
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have premission to preform this action', 403),
      );
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get user besed on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email adress', 404));
  }
  // Generatethe random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  ///3) send it to user email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/ api / v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    return res.status(200).json({
      status: 'success',
      message: 'token send to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, try again latter',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  console.log(1);
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  console.log(hashedToken);
  console.log(Date.now());

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if token has not expired, and there is user ,set the new password
  console.log(user);
  if (!user) {
    return next(new AppError('token is invalid or has expired', 400));
  }
  console.log(3);
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: true }); // we want the validator to confirm if the password equa to the password confirm

  //3) update changedPassword property for the user
  // 4) log the user in , send JWT
  console.log(4);
  createSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from colection
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  /// 3)if the password is currect
  console.log('before password change');
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save({ validateBeforeSave: true });
  console.log('after password change');
  createSendToken(user, 200, res);

  //2) check if the posted password is correct
  //3)if so , update password
  //4) log user in , send jwt
});
