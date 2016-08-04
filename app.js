//allows require('databridge') after npm install databridge

var db = new Object();

db.config = require('./config.json');

db.bridge = require('./bin/bridge');






module.exports = db;
