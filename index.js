//allows require('databridge') after npm install databridge

var db = new Object();
var cfg;

try {
  cfg = require('./config');
} catch (e) {
  cfg = null;
}

db.setupConfig = require('./bin/config-setup');
db.config = cfg;
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
