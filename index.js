//allows require('databridge') after npm install databridge

var fs = require('fs');

var db = new Object();

db.setupConfig = require('./bin/config-setup');
db.config = (fs.existsSync('./config.json')) ? require('./config') : null;
db.bridge = require('./bin/bridge');
db.batchParse = require('./bin/batch-parse');
db.bridgeRunner = require('./bin/bridge-runner');
db.list = {
  src: require('./bin/list-src'),
  dest: require('./bin/list-dest'),
  tables: require('./bin/list-tables'),
  batches: require('./bin/list-batches')
};

module.exports = db;
