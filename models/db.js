var config            = require('../configs/index.json')
var mongoose          = require('mongoose');
var dbURL             = config.dbURI;
mongoose.connect(dbURL, {
  useMongoClient: true
});
