const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
/* const User = require('./../models/userModel'); */
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      /* validate: [validator.isAlpha, 'Tour name must only contain characters'], */
    },
    slug: String,
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficlty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy  ,medium , difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: { tye: Number, default: 0 },
    price: { type: Number, required: [true, 'A Thourmust have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on NEW document crated
          return val < this.price;
        },
        message: 'Discount price: ({VALUE}) cant be lower then the total price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image '],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },

    startLocation: {
      //GeoJSON

      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },

      coordinates: [Number],
      adress: String,
      description: String,
    },
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    /* guides: Array, */
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
//it is not enoght to remove from the code we realy need to delete it from the data base
/* tourSchema.index({ price: 1 }); */
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
/// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
//Document middleware : runs before .save() ans .create() but not in insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
/* toursSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
}); */

/// documetn middleware have acces to the document
/// in post document middleware we have access to the doc element in the input of the function
/// in the pre middeware we have acess to the this which point to the document
/// there can be multiple pre middleware and post midlware
////the post and pre middleware also can hooks
///the pre middleware call after all the post middle ware finished

/* tourSchema.pre('save', function (next) {
  console.log('Will save document..');
  next();
});

tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
}); */

////query middleware
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -passwordResetExpires',
  });
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took :${Date.now() - this.start} milliseconds`);
  next();
});
//// aggregation middleware
/* tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});
 */
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
