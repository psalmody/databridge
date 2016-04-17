/**
 * Bridging between source and destination
 */
module.exports = function(config, opt, moduleCallback) {

  //setup timer and define shortcuts for log/error
  var tmr = require('./timer'),
    async = require('async'),
    missingKeys = require('./missing-keys'),
    l = console.log,
    error = console.error,
    fs = require('fs'),
    colParser = require('./col-parser'),
    Spinner = require('cli-spinner').Spinner,
    spinner = new Spinner('processing... %s'),
    outputFile = require('./output-file');

  //options will now include all things the source/destination scripts need
  opt.cfg = config;
  opt.bin = __dirname.replace(/\\/g, '/') + '/';
  //start timer
  opt.timer = require('./timer');
  //spinner if not task
  opt.spinner = (opt.task) ? false : (function() {
    var s = new Spinner('processing... %s');
    s.setSpinnerString(0);
    return s;
  })();
  //setup log
  opt.log = (process.env.NODE_ENV == 'development') ? require('./log-dev')(opt) : require('./log')(opt);

  //check usage first
  if (missingKeys(opt, ['source', 'destination']) !== false) return moduleCallback('Bad usage for bridge. Check your syntax.');

  //make sure enough parameters were passed
  //if (argvs._.length < 4) return console.error('Incorrect usage. Try: \n   npm start <source> <table/query/file name> to <destination>\n  Optionally add --defaults flag to use default binds from binds.js rather than prompt for bind values.');

  try {
    source = require(opt.cfg.dirs.sources + opt.source);
  } catch (e) {
    error('"' + opt.source + '" is not a valid source.');
    error(e.stack);
    return;
  }

  try {
    destination = require(opt.cfg.dirs.destinations + opt.destination);
  } catch (e) {
    error('"' + opt.destination + '" is not a valid destination.')
    error(e.stack);
    return;
  }

  async.waterfall([
    //setup opfile
    function(cb) {
      outputFile(opt, function(err, opfile) {
        if (err) return moduleCallback(err);
        opt.opfile = opfile;
        cb(null);
      })
    },
    //run source
    function(cb) {
      if (opt.spinner) opt.spinner.start();
      source(opt, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    //attempt to get column definitions
    function(cb) {
      colParser(opt.opfile, function(err, columns) {
        if (err) return cb(err);
        cb(null, columns);
      })
    },
    function(columns, cb) {
      destination(opt, columns, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    }
  ], function(err) {
    if (opt.spinner) opt.spinner.stop(true);
    try {
      if (process.NODE_ENV !== 'development') opfile.clean();
    } catch (e) {
      if (typeof(opfile) !== 'undefined') error(e);
    }
    if (err) {
      error(opt.timer.now.str());
      //error(err);
      return moduleCallback(err);
    }
    l(opt.timer.now.str());
    l('Completed ' + opt.source + ' ' + opt.table + ' to ' + opt.destination + '.');
    moduleCallback();
  })
}
