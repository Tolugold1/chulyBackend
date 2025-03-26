var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("dotenv").config();
const session = require("express-session");

const MongoStore = require('connect-mongo');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const bookingRouter = require("./routes/bookings.router");
const businessAnalyticsRouter = require("./routes/business.analytics.router");
const customerRouter = require("./routes/customer.router");
const businessRouter = require("./routes/business.router")


var { HTTPError } = require("./utils/error");
var cors = require("cors");
var { connectDB } = require("./utils/connectDB")
var app = express();
const passport = require("passport");


// connect to the database.
connectDB();

app.use(cors({ origin: ["https://airbox-tgold.netlify.app", "http://localhost:5173" ], credentials: true }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    name: "session_id",
    saveUninitialized: false,
    resave: false,
    secret: process.env.SECRET_KEY,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL,
      // other options if needed
    }),
    // cookie: { secure: process.env.NODE_ENV === 'production' },
    // cookie: {
    //   maxAge: 1000 * 60 * 60 * 2, // 2 hours
    //   secure: false,
    //   httpOnly: true,
    // }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', indexRouter);
app.use('/api/auth', usersRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/businessAnalytics', businessAnalyticsRouter);
app.use('/api/customer', customerRouter);
app.use('/api/business', businessRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (err instanceof HTTPError) {
    return res.status(err.statusCode).json({
      title: err.name,
      message: err.message,
    });
  }

  // handle duplicate error from mongoose
  if (err.code == 11000) {
    return res.status(400).json({
      title: "Duplicate Field",
      message: `${Object.keys(err.keyValue)} already exists`
    })
  }
  res.locals.message = err.message;

  // render the error page
  res.status(500).json({ title: "Error", message: "Error message", error: err});
  // res.render('error');
});

module.exports = app;
