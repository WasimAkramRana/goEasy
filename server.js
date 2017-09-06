var express                   = require('express');
var app                       = express();
var apiRoutes                 = express.Router();
require('./models/db')
var bodyParser                = require('body-parser');
var bunyan                    = require('bunyan');
var cors                      = require('cors');
var bunyanMiddleware          = require('bunyan-middleware');
var cookieParser              = require('cookie-parser');
var passport                  = require('passport');
var jwt                       = require('jsonwebtoken');
var mongoose                  = require('mongoose');
var config                    = require('./configs/index.json');
var bunyanLogger              = bunyan.createLogger({name:config.appName, streams: [{path: config.logsPath}]});

app.use(bunyanMiddleware(bunyanLogger));
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(cors());
app.use(function(req, res, next) {
  req.currentUser = {};
  next();
});

/**
* This block of code is defined for to enable cores
**/
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res) {
   res.status(200).json({sucess:{message:'app working'}});
});
app.use('/v1/users', require('./routes/users'));

/**
* This middleware is defined for to authenticate all api end points and check token
**/
app.use(function(req, res, next) {
	var token = req.body.token || req.param('token')  || req.headers['x-access-token'];
  if(token) {
    req.currentUser = {};
		jwt.verify(token, config.secretKey, function(err, decoded) {
      if(err) {
				return res.status(406).json({error: {message:'unauthorized user'}});
			} else {
				req.decoded                  = decoded;
        req.currentUser.userID       = decoded._id;
        req.currentUser.mobileNumber = decoded.mobileNumber;
        req.currentUser.email        = decoded.email;
				next();
			}
		});
	} else {
		return res.status(401).send({error: {code:'tokenError', message:'No token provided'}});
	}
});

/**
* This middleware is use for to define the error
*/
app.use(function(err, req, res, next) {
  console.error(err.stack);
   res.status(409).json({error: 'Something wrong with request'});
});

// app.listen(3002, "0.0.0.0", function() {
//     console.log('Listening to port:  ' + 3002);
// });
app.listen(config.appPort);
console.log("server are running on port: " + config.appPort);
