var mongoose            = require('./dbConnections');
var crypto              = require('crypto');
var jwt                 = require('jsonwebtoken');
var config              = require('../configs/index.json');
var async               = require('async');

var userSchema = new mongoose.Schema({
  email                  : String,
  mobileNumber           : Number,
  password               : String,
  salt                   : String,
  emailVerified          : Boolean,
  emailVerificationToken : String
});

/**
* This model method is use for to set password in encrypted format
*/
userSchema.methods.setPassword = function(password) {
  this.salt     = crypto.randomBytes(16).toString('hex');
  this.password = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

/**
* This model method is use for validate user password
*/
userSchema.methods.validPassword = function(password) {
  var password = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
  return this.password === password;
};

/**
* This model method is use for to generate token
*/
userSchema.methods.generateJwt = function() {
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 1);
  return jwt.sign({
    _id          : this._id,
    mobileNumber : this.mobileNumber,
    email        : this.email,
    exp          : parseInt(expiry.getTime() / 1000)
  }, config.secretKey); // This SECRET key here only for testing purpose!
};

var users = mongoose.mainDBConnection.model('users', userSchema);
module.exports = users;
