require("dotenv").config();
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const jwtExtract = require("passport-jwt").ExtractJwt;
const jwtStrategy = require("passport-jwt").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./model/account");
const { ACCOUNT_TYPE, AUTH_TYPE } = require("./utils/constants");
const helper = require("./utils/helper");
const { redisClient } = require("./utils/redis/redisConf");
const { hashSync, compare } = require("bcrypt");

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  }).maxTimeMS(60000);
});

exports.getToken = function (user) {
  return jwt.sign(user, process.env.SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_LIFETIME });
};

exports.getRefreshToken = function (user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_LIFETIME });
};

exports.encryptToken = function (token) {
  let salt = 10;
  return hashSync(token, salt);
};

const opt = {};
opt.jwtFromRequest = jwtExtract.fromAuthHeaderAsBearerToken();
opt.secretOrKey = process.env.SECRET_KEY;

exports.jwtPassport = passport.use(
  new jwtStrategy(opt, (jwt_payload, done) => {
    // console.log("jwt_payload", jwt_payload);

    User.findOne({ _id: jwt_payload._id }, (err, user) => {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    }).maxTimeMS(60000);
  })
);

exports.verifyUser = passport.authenticate("jwt", { session: "false" });

exports.authenticateJWT = async (req, res, next) => {
  let token = req.cookies.jwt || req.headers.authorization;
  // console.log("token", req.headers.authorization.split(" ")[1]);
  // console.log("token", req.headers);
  if (req.cookies.jwt == undefined || req.cookies.jwt == null) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (token) {
    try {
      // Verify JWT token
      const user = await jwt.verify(token, process.env.SECRET_KEY);
      // If everything is good, attach user to request
      req.user = user;
      next();

    } catch (err) {
      console.log("JWT verification error:", err.message);

      // Clear cookies if token is invalid or expired
      res.clearCookie('session_id');
      res.clearCookie('jwt');
      res.clearCookie('refreshToken');

      return res.status(403).json({
        success: false,
        message: err.name === "TokenExpiredError" ? "Token expired" : "Unauthorized",
        status: process.env.FRONTEND_URL,
      });
    }
  } else {
    console.log("No token provided");
    res.status(401).json({
      success: false,
      status: process.env.FRONTEND_URL,
      message: "No token provided",
    });
  }
};

