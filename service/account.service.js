require("dotenv").config();
const User = require("../model/account");
const BusinessProfile = require("../model/businessAccount")
const {
    ForbiddenError,
    InvalidDetailsError,
    UnauthorizedError,
    FieldError,
    NotFoundError,
    ExpiredError,
    AlreadyExistError,
    ApplicationError,
    ExtractionFailed,
    ResumeNotSaved,
    OperationFailedError,
} = require("../utils/error");
const { AUTH_TYPE } = require("../utils/constants");
// const { redisClient } = require("../utils/redis/redisConf");
const Userverification = require("../model/verificationSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { SignToken } = require("../utils/helper");
const { sendVerificationMail } = require("../email/email");
const helper = require("../utils/helper")
const { compareHashed } = require("../utils/helper");
const authenticate = require("../authentication");

exports.SignUp = async function ({ name, email, password, confirmPassword, acctType }) {
    try {
      console.log("email", email);
      email = email?.trim().toLowerCase();
      name = name?.trim();
      password = password?.trim();
      confirmPassword = confirmPassword?.trim();

      if (await User.findOne({ email }).lean().select("email")) {
        throw AlreadyExistError("User with this email already exists");
      }

      let user = new User({ username: email });
      if (password) {
        user.password = password;
        user.authType = AUTH_TYPE.PASSWORD;
      }
      // create this user analytics schema
    //   let analytics = new Analytics({userId: user._id});
    //   await analytics.save();
      user.email = email;
      user.AcctType = acctType;
    //   user.analytics = analytics._id;
      user.name = name;
  
      let profile_id = await helper.generateUniqueString(user);
      console.log(user, profile_id)
  
      user.profile_id = profile_id;
   
      let uniquestring = await SignToken({id: user._id});

      let userVerificationData = await Userverification.findOne({ userId: user._id });
      if (!userVerificationData) {
          let user_verification = new Userverification({
              userId: user._id,
              uniquestring: uniquestring,
              expireAt: Date.now() + 1800000,
          });
          await user_verification.save();
      }
      
      await sendVerificationMail({
        // type: "verification",
        recipient: user.email,
        token: uniquestring,
        route: "verify-uniquestring"
      });
  
      await user.save();

      return { "status": "User created successfully", "statusCode": 200 };
    } catch (error) {
      console.log("sigining error", error);
      throw error;
    }
}; 

exports.SignIn = async function ({ res, username, password }) {
    try {
      username = username?.trim().toLowerCase();
      let user = await User.findOne({ username: username });
      // compare password
      if (!user) {
        console.log("No data")
        throw NotFoundError("Account not found.", 404);
      } else {
        if (user.authType == "PASSWORD" && user.Confirmed !== true) {
          let uniquestring = await SignToken({id: user._id});
          await sendVerificationMail({
            // type: "verification",
            recipient: user.email,
            token: uniquestring,
            route: "verify-uniquestring"
          });
          return {
            success: false,
            statusCode: 404,
            status: user.Confirmed !== true ?  "Please you need to verify your email. The verification mail has been sent again to your email": "This email have been registered on another account.."
          }
        } else if (user.authType === "PASSWORD") {
          const pwdStat = await compareHashed(password, user.password);
          console.log("PwdStat", pwdStat);
  
          if (pwdStat) {
            // if (user.profile_id === undefined) {
            //   user.profile_id = await helper.generateUniqueString(user);
            // }
            // await user.save();
            let token =  authenticate.getToken({ _id: user._id });

            user.save();
            let profile_status;
  
            // store tokens into redis cache
            // await redisClient.set("token-"+ user._id, token);
            // await redisClient.set("refreshToken-"+ user._id, refreshToken);

            if (user.AcctType === "Client") {
              return {
                success: true,
                statusCode: 200,
                status: "Sign in successful",
                token: token,
                profile_status: { AcctType: user.AcctType }
              };
            } else if (user.AcctType === "Official") {
              return {
                success: true,
                statusCode: 200,
                status: "Sign in successful",
                token: token,
                profile_status: { AcctType: user.AcctType }
              };
            }
          } else {
            return {
              success: false,
              statusCode: 404,
              status: "Incorrect password."
            };
          }
        }
      }
  
    } catch (error) {
      console.log("sigining error", error);
      throw error;
    }
  };  
  
  exports.GetMyInfo = async function ({ id }) {
    try {
      const user = await User.findOne({_id: id}); // .populate("analytics");
      if (!user) {
        throw NotFoundError("User not found");
      }
      // console.log("user", user);
      return user;
    } catch (error) {
      throw error;
    }
  };
  
  exports.ChangeMyPassword = async function ({ id, password }) {
    try {
      // Get the user
      console.log("password", password);
      const user = await User.findById(id);
      user.password = password;
      user.refreshTokens = [];
      await user.save();
      console.log("user", user)
      return "Password changed successfully";
    } catch (error) {
      throw error;
    }
  };

// THE FORGOT PASSWORD SHOULD TAKE THE USER EMAIL AND SEND AN OTP TO THAT EMAIL
// THIS EMAIL WILL BE USED TO RESET THE PASSWORD....
exports.ForgotPassword = async function ({ username }) {
    try {
      const user = await User.findOne({ username: username });
      console.log("user", user);
      if (user == null) {
        throw NotFoundError("User not found");
      }
  
      let reset_token = await SignToken({ id: user._id });
  
      user.reset_password_token = reset_token;
      user.reset_password_expiresAt = Date.now() + 300000;
  
      await sendVerificationMail({
        recipient: user.username,
        token: reset_token,
        route: "validate-token"
      });

      await user.save();
      return "An email has been sent to your mail.kindly click the link and follow the instruction."
    } catch (error) {
      throw error;
    }
};

exports.VerifyOTP = async function ({ res, otpstring }) {
  try {
    let verified = jwt.verify(otpstring, process.env.SECRET_KEY);
    console.log("verified", verified);

    if (!verified) {
      throw InvalidDetailsError("invalid OTP");
    }

    let [otp_user, user] = await Promise.all([
      Userverification.findOne({ userId: verified.id }).lean(), 
      User.findOne({ _id: verified.id }).lean()
    ]);

    if (!otp_user && !user) {
      throw NotFoundError("No user account found.");
    }

    console.log("otpstring =", otpstring);
    const redirectUrl = process.env.FRONTEND_URL;

    // Check if OTP is expired
    if (otp_user !== undefined && otp_user.expireAt < Date.now()) {
      await Userverification.deleteOne({ userId: verified.id });
      await User.deleteOne({ _id: verified.id });
      // Redirect immediately if expired
      return res.redirect(`${redirectUrl}/login?exp=Account could not be verified`);
    } else {
      return res.redirect(`${redirectUrl}/login`);
    }

    // Update user as confirmed
    await User.updateOne({ _id: verified.id }, { Confirmed: true }, { new: true });
    await Userverification.deleteOne({ userId: verified.id });

    // Redirect to login after successful verification
    return res.redirect(`${redirectUrl}/login`);

  } catch (error) {
    console.error("Error in VerifyOTP:", error);
    // Only send a response if headers haven't already been sent
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
  }
};


exports.validateToken = async function ({ res, token }) {
  try {
    console.log("token", token);
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    console.log("verified", verified)
    if (!verified) {
      console.log("Token not verified.")
      // redirect to the same forgot password page.
      res.redirect(`${process.env.FRONTEND_URL}/forgotPassword`)
    }
    let id = verified.id;
    const user = await User.findOne({ _id: id });
    if (!user) throw err.NotFoundError("User not found");
    let route;
    if (Date.now() > user.reset_password_expiresAt) {
      route = "Expire";
      helper.handleRedirectLink(res, id, route);
      throw ExpiredError("OTP has expired");
    }
    console.log("reset_token", user.reset_password_token);
    if (token == user.reset_password_token) {
      route = "Reset password page";
      console.log("route", route);
      // return res.redirect(`${process.env.FRONTEND_URL}/reset?userId=${id}`);
      return res.redirect(`${process.env.FRONTEND_URL}/reset?userId=${id}`);
    } else {
      throw InvalidDetailsError("Token not the same with the store token", 400);
    }
  } catch (error) { }
};
