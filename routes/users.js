var express     = require('express');
var router      = express.Router();
var authCtrl    = require('../controllers/authController');

router.post('/signup',          authCtrl.register);
router.post('/login',            authCtrl.login);
//router.put('/change/password',  authCtrl.forgotPassword);
router.get('/verify',           authCtrl.emailVerify);
router.get('/list',             authCtrl.getUsersList);

module.exports = router;
