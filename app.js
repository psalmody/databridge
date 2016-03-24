//setup timer and define shortcuts for log/error
var tmr = require('./bin/timer'),
  args = process.argv,
  async = require('async'),
  l = console.log,
  error = console.error,
  fs = require('fs'),
  colParser = require('./bin/colParser'),
  argvs = require('minimist')(process.argv.slice(2));

//make sure enough parameters were passed
if (argvs._.length < 4) return console.error('Incorrect usage. Try: \n   npm start <source> <table/query/file name> to <destination>\n  Optionally add --defaults flag to use default binds from binds.js rather than prompt for bind values.');

try {
  var source = require('./bin/sources/' + argvs._[0]);
} catch (e) {
  error('"' + args[2] + '" is not a valid source.');
  error(e.stack);
  return;
}

try {
  var destination = require('./bin/destinations/' + argvs._[3]);
} catch (e) {
  error('"' + args[5] + '" is not a valid destination.')
  error(e.stack);
  return;
}

async.waterfall([
  //moving to source - destination type
  function(cb) {
    source(args, function(err, opfile, log, timer) {
      if (err) return cb(err);
      cb(null, opfile, log, timer);
    })
  },
  //attempt to get column definitions
  //TODO this should be run by source, not here
  function(opfile, log, timer, cb) {
    colParser(opfile, function(err, columns) {
      if (err) return cb(err);
      cb(null, opfile, columns, log, timer);
    })
  },
  function(opfile, columns, log, timer, cb) {
    destination(args, opfile, columns, log, timer, function(err, opfile) {
      if (err) return cb(err);
      cb(null, opfile);
    })
  }
], function(err, opfile) {
  try {
    opfile.clean();
  } catch (e) {

  }
  if (err) {
    error(tmr.now.str());
    return error(err);
  }

  l(tmr.now.str());
  l('Completed');
})
