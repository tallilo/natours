const mongoose = require('mongoose');

const dotenv = require('dotenv');

process.on('uncaughException', (err) => {
  console.log(err);
  console.log(err.name, err.message);

  process.exit(1);
});

dotenv.config({ path: `./config.env` });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`App runing on port ${PORT}...`);
});
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('unhandler rejection');
  server.close(() => {
    process.exit(1);
  });
});
