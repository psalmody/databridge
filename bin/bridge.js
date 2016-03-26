/**
 * Bridging between source and destination
 */
module.exports = function(opts) {
  //setup timer and define shortcuts for log/error
  var tmr = require('./timer'),
    args = process.argv,
    async = require('async'),
    l = console.log,
    error = console.error,
    fs = require('fs'),
    colParser = require('./colParser'),
    Spinner = require('cli-spinner').Spinner,
    spinner = new Spinner('processing... %s');

  spinner.setSpinnerString(0);

  //make sure enough parameters were passed
  //if (argvs._.length < 4) return console.error('Incorrect usage. Try: \n   npm start <source> <table/query/file name> to <destination>\n  Optionally add --defaults flag to use default binds from binds.js rather than prompt for bind values.');

  try {
    source = require('./bin/sources/' + opts.source);
  } catch (e) {
    error('"' + args[2] + '" is not a valid source.');
    error(e.stack);
    return;
  }

  try {
    destination = require('./bin/destinations/' + opts.destination);
  } catch (e) {
    error('"' + args[5] + '" is not a valid destination.')
    error(e.stack);
    return;
  }

  async.waterfall([
    //moving to source - destination type
    function(cb) {
      spinner.start();
      source(opts, spinner, function(err, opfile, log, timer) {
        if (err) return cb(err);
        cb(null, opfile, log, timer);
      })
    },
    //attempt to get column definitions
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
    spinner.stop(true);
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
}
