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



  //opt includes all things the source/destination scripts need
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

  //setup response object
  var response = require(opt.bin + 'response')(opt);
  response.binds = opt.binds;
  //check usage first
  if (missingKeys(opt, ['source', 'destination']) !== false) return moduleCallback('Bad usage for bridge. Check your syntax.');
  //try to require source
  try {
    source = require(opt.cfg.dirs.sources + opt.source);
  } catch (e) {
    error('"' + opt.source + '" is not a valid source.');
    error(e.stack);
    return;
  }
  //try to require destination
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
      //start logging with response object
      response.source.start();
      try {
        source(opt, function(err, rows, columns) {
          response.source.stop();
          if (err) {
            response.source.error(err);
            return cb(err);
          }
          response.source.respond('ok', rows, columns);
          cb(null);
        })
      } catch (e) {
        console.trace(e);
      }
    },
    //attempt to get column definitions
    function(cb) {
      colParser(opt.opfile, function(err, parsedCols) {
        if (err) return cb(err);
        cb(null, parsedCols);
      })
    },
    function(parsedCols, cb) {
      response.destination.start();
      destination(opt, parsedCols, function(err, rows, columns) {
        response.destination.stop();
        if (err) {
          response.destination.error(err);
          return cb(err);
        }
        response.destination.respond('ok', rows, columns);
        cb(null);
      })
    }
  ], function(err) {
    opt.log.group('Bridge').log('Finished a bridge');
    //try and clean up the output file and stop spinner

    try {
      opfile.clean();
    } catch (e) {
      if (typeof(opfile) !== 'undefined') error(e);
    }
    //error handling
    if (err) {
      error(err)
      error(opt.timer.now.str());
      //error(err);
      return moduleCallback(err);
    }
    //success! log and return response object
    l(opt.timer.now.str());
    l('Completed ' + opt.source + ' ' + opt.table + ' to ' + opt.destination + '.');
    //response.check() returns null if no problem
    //opt.log.group('').log(JSON.stringify(response.strip(), null, 2));
    opt.log.log(JSON.stringify(response.strip(), null, 2));
    if (opt.spinner) opt.spinner.stop(true);
    return moduleCallback(response.check(), response);
  })
}
