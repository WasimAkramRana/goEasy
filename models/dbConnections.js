var mongoose              = require('mongoose');
var config                = require('../configs/index.json')
mongoose.mainDBConnection = mongoose.createConnection(config.dbURI, {
  useMongoClient: true
});
module.exports            = mongoose;
