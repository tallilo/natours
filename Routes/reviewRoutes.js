const express = require('express');

const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const Router = express.Router({ mergeParams: true });
Router.use(authController.protect);
Router.route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.postReview,
  );
/// still not implemented that only the user that wrote the review can delete the review and only on the  tour that the review was wrote
Router.route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('admin', 'user'),
    reviewController.deleteReview,
  )
  .patch(
    authController.restrictTo('admin', 'user'),
    reviewController.UpdatesReview,
  );

module.exports = Router;

//POST /tour/123fdre456/reviews -> nested route
