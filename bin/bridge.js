/**
 * Bridging between source and destination
 */
module.exports = function(config, opts, moduleCallback) {

  //setup timer and define shortcuts for log/error
  var tmr = require('./timer'),
    async = require('async'),
    missingKeys = require('./missing-keys'),
    l = console.log,
    error = console.error,
    fs = require('fs'),
    colParser = require('./col-parser'),
    Spinner = require('cli-spinner').Spinner,
    spinner = new Spinner('processing... %s');

  //console.log(opts);
  if (missingKeys(opts, ['source', 'destination']) !== false) return moduleCallback('Bad usage for bridge. Check your syntax.');

  spinner.setSpinnerString(0);
  //don't start if -k or --task (accomplished by overriding spinner.start())
  if (opts.task) spinner.start = function() {
    return;
  };

  //make sure enough parameters were passed
  //if (argvs._.length < 4) return console.error('Incorrect usage. Try: \n   npm start <source> <table/query/file name> to <destination>\n  Optionally add --defaults flag to use default binds from binds.js rather than prompt for bind values.');

  try {
    source = require(config.dirs.sources + opts.source);
  } catch (e) {
    error('"' + opts.source + '" is not a valid source.');
    error(e.stack);
    return;
  }

  try {
    destination = require(config.dirs.destinations + opts.destination);
  } catch (e) {
    error('"' + opts.destination + '" is not a valid destination.')
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
      destination(opts, opfile, columns, log, timer, function(err, opfile) {
        if (err) return cb(err);
        cb(null, opfile, log);
      })
    }
  ], function(err, opfile, log) {
    spinner.stop(true);
    try {
      if (process.NODE_ENV !== 'development') opfile.clean();
    } catch (e) {
      if (typeof(opfile) !== 'undefined') error(e);
    }
    if (err) {
      error(tmr.now.str());
      //error(err);
      return moduleCallback(err);
    }
    l(tmr.now.str());
    l('Completed ' + JSON.stringify(opts));
    moduleCallback();
  })
}
