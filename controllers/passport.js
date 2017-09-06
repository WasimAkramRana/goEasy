var passport              = require('passport');
var LocalStrategy         = require('passport-local').Strategy;
var mongoose              = require('mongoose');
var User                  = require('../models/users');

/**
* This function is used for to authanticate user credentials using passport LocalStrategy
*/
passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  function(email, password, done) {
    User.findOne({email: email}, function(err, user) {
      try {
        if(user && 'password' in user._doc && user._doc.emailVerified === true) {
          // Return if user not found in database
          if(!user || !user.validPassword(password)) {
            return done(null, false, {error: {message:'Invalid credentials'}});
          }

          // If credentials are correct, return the user object
          return done(null, user);
        } else {
          // If User not verified or not created with us, return the error
            return done(null, false, {error: {message:'Email not verified'}});
        }
      } catch(e) {
        return done(null, false, {error: {message: '"'+ e + '"'}});
      }
    });
  }
));
