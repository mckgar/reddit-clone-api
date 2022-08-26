require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const createError = require('http-errors');

const routes = require('./routes/index');

const app = express();

require('./mongoConfig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/v1', routes);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  const message = err.message;
  if (req.app.get('env') === 'development') {
    console.log(err);
  }

  return res.status(err.status || 500).json(
    {
      message
    }
  )
});

module.exports = app;
