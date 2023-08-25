const express = require('express');
const multer = require('multer');
const tourController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const Router = express.Router();

Router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser,
);
Router.post('/signup', authController.signup);
Router.post('/login', authController.login);
Router.get('/logout', authController.logout);
Router.post('/forgotPassword', authController.forgotPassword);
Router.patch('/resetPassword/:token', authController.resetPassword);

///everything after this middleware is protected
Router.use(authController.protect);
Router.patch(
  '/updateMyPassword',

  authController.updatePassword,
);
Router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
Router.delete('/deleteMe', userController.deleteMe);

Router.use(authController.restrictTo('admin'));
Router.route('/')
  .get(tourController.getAllUsers)
  .post(tourController.createUser);
Router.route('/:id')
  .get(tourController.getUser)
  .patch(tourController.updateUser)
  .delete(tourController.deleteUser);

module.exports = Router;
