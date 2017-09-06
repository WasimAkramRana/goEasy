var passport          = require('passport');
var mongoose          = require('mongoose');
var User              = mongoose.model('users');
var async             = require('async');
var nodemailer        = require('nodemailer');
var randomstring      = require('randomstring');
var config            = require('../configs/index.json');
var crypto            = require('crypto');
var jwt               = require('jsonwebtoken');
var unirest           = require('unirest');

var smtpTransport = nodemailer.createTransport({
    host: config.emailConfig.smtpServer,
    port: config.emailConfig.smtpPort,
    secure: true,
    auth: {
        user: config.emailConfig.username,
        pass: config.emailConfig.password
    }
});

var sendJSONresponse  = function(res, status, content) {
  res.status(status);
  res.json(content);
};

/**
* This function is used for to send email verification link on signup user email
*/
function sendVerificationEmail(email, randomString,  req, res, next) {
  let link               = 'http://localhost:3002/v1/users/verify?verificationToken=' + randomString + '&email=' + email;
  let mailOptions = {
    from    : config.appName + '<' + config.emailConfig.username  +'>',
    to      : email,
    subject : "Please confirm your Email account",
    html    :"Hello " + email + ",<br> <br>Thanks for signing up! <br>Your account has been created with us.<br> <br> Please click on below link to activate your account:<br> <a href=" + link + "> Click here to verify </a>"
  }

  smtpTransport.sendMail(mailOptions, function(error, response) {
    if(error) {
      res.status(401).json({error: {message:'Email not send to user email address'}});
    } else {
      next();
    }
  });
}

/**
* This method is use for signup user email Verification
*/
module.exports.emailVerify = function(req, res) {
  User.findOne({email:req.query.email}, {emailVerificationToken:1, email:1}, function(err, response) {
    if(response) {
      let emailVerificationToken = response._doc.emailVerificationToken;
      let emailID = response._doc.email;
      if(req.query.verificationToken === emailVerificationToken) {
        emailVerified(emailID, req, res);
      } else {
        res.status(401).json({error: {code:'emailVerifyFailed', message:'Email Verification Failed'}});
      }
    } else {
      res.status(409).json({error: {code:'unauthorisedUser', message:'unauthorised User'}});
    }
  });
};

function emailVerified(emailID, req, res) {
  User.update({email:emailID}, {$set:{emailVerified:true}}, function(err, response) {
    if(err) {
      res.json(err);
    } else {
      res.status(200).json({success: {code:'emailVerifySuccess', message:'Email successfully verified'}});
    }
  });
}

/**
* This function is used for user registration
*/
module.exports.register = function(req, res) {
  var randomString = randomstring.generate();
  async.series([
    function(next) {
      // User.findOne({ $or: [{email:req.body.email}, {username: req.body.userName}]}, {email:1, username:1}, function(err, response) {
      //   if(!response) {
          var user           = new User();
          user.email         = req.body.email;
          user.mobileNumber  = req.body.mobileNumber;
          user.emailVerified = false;
          user.setPassword(req.body.password);
          user.emailVerificationToken = randomString;
          user.save(function(err, data) {
            if(err) {
              res.status(500).json({error: {message:'Internal server error'}});
            } else {
              next();
            }
          });
        // } else {
        //   res.status(409).json({error: {message: 'Email or username already registerd with us'}});
        // }
      //});
    },
    function(next) {
      sendSms(req.body.mobileNumber, req, res, next);
    }
    // function(next) {
    //   sendVerificationEmail(req.body.email, randomString, req, res, next);
    // }
  ],
  function(err, results) {
    if(err) {
      res.json(err);
    } else {
      res.status(200).json({success: {message:'User Successfully registerd with us and email Successfully sent to the user email address'}});
    }
  });
};

function sendSms(number, req, res, next) {
  let otp      = randomstring.generate({length: 4, charset: 'numeric'});
  let postData = {
    'user'     : '8800847728',
    'pass'     : '498b5ac',
    'sender'   : 'GOEASY',
    'phone'    : number,
    'text'     : 'hello',
    'priority' : 'ndnd',
    'stype'    : 'normal'
  }
  unirest.post('http://bhashsms.com/api/sendmsg.php')
  .header('Accept', 'application/json')
  .send()
  .end(function (err, response) {
    if(err) {

    }
    next();
    console.log(response.body);
  });
}

/**
* This function is used for user login module
*/
module.exports.login = function(req, res) {
  async.series([
    function(next) {
      findUser(req, res, next);
    },
    function(next) {
      validPassword(req, res, next);
    },
    function(next) {
      let token = generateJwt(req, res);
      res.status(200).json({"token" : token});
    }
  ],
  function(err, result) {
    console.log(err);
  })
};

function generateJwt(req, res) {
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 1);
  return jwt.sign({
    _id          : req.userDetails._id,
    mobileNumber : req.userDetails.mobileNumber,
    email        : req.userDetails.email,
    exp          : parseInt(expiry.getTime() / 1000)
  }, config.secretKey); // This SECRET key here only for testing purpose!
}

function findUser(req, res, next) {
  let emailID = req.body.email;
  let number  = req.body.mobileNumber;
  User.findOne({$or:[{email:emailID}, {mobileNumber:number}]}, function(err, response) {
    if(response) {
      req.userDetails = response._doc;
      next();
    } else {
      res.status(409).json({error:{code:'userNotFound', message:'this Email or mobile Number not regitered with us'}});
    }
  })
};


function validPassword(req, res, next) {
  let password = crypto.pbkdf2Sync(req.body.password, req.userDetails.salt, 1000, 64).toString('hex');
  if(req.userDetails.password === password) {
    next();
  } else {
    res.json({error: {code:'InvalidCredential', message:'You have enter wrong password'}})
  }
}
/**
* This function is used for user login module
*/
module.exports.getUsersList = function(req, res) {
  User.find({}, function(err, resData) {
    if(resData) {
      res.status(409).json(resData);
    } else {
      res.status(409).json({error: {message: err}});
    }
  })
};
