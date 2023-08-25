const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
/* const reviewController = require('./../controllers/reviewController'); */
const reviewRouter = require('./../Routes/reviewRoutes');
const Router = express.Router();

//POST /tour/234fgd/reviews
//GET /tour/234fgd/reviews
//GET /tour/234fgd/reviews/45322dfgd

Router.use('/:tourId/reviews', reviewRouter);

Router.route('/top-5-cheap').get(
  tourController.aliasTopTours,
  tourController.getAllTours,
);
Router.route('/tour-stats').get(tourController.getTourStats);
Router.route('/monthly-plan/:year').get(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlan,
);
Router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(
  tourController.getToursWithin,
);
Router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
// /tours-distance?distance=233&center=40,45&unit=mi
// /tours-distance/233/center/-40,45/unit/mi
Router.route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.patchTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

Router.route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.postTour,
  );

module.exports = Router;
