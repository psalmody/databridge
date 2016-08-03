/**
 * Bridging between source and destination
 */
module.exports = function(config, opt, moduleCallback) {

  //setup timer and define shortcuts for log/error
  var async = require('async'),
    missingKeys = require('./missing-keys'),
    colParser = require('./col-parser'),
    Spinner = require('cli-spinner').Spinner,
    outputFile = require('./output-file'),
    source,
    destination,
    err,
    Timer = require('./timer');


  //opt includes all things the source/destination scripts need
  opt.cfg = config;
  opt.bin = __dirname.replace(/\\/g, '/') + '/';
  //start timer
  opt.timer = new Timer();
  //spinner if not task
  opt.spinner = (opt.task) ? false : (function() {
    var s = new Spinner('processing... %s');
    s.setSpinnerString(0);
    return s;
  })();
  //setup log
  switch(opt.cfg.logto) {
      case 'console':
        opt.log = require('./log-dev')(opt);
        break;
      case 'file':
        opt.log = require('./log')(opt);
        break;
      case 'test':
        opt.log = require('./log-test')(opt);
        break;
  }

  //setup response object
  var response = require(opt.bin + 'response')(opt);
  response.binds = opt.binds;
  //check usage first
  if (missingKeys(opt, ['source', 'destination']) !== false) return moduleCallback('Bad usage for bridge. Check your syntax.');

  //try to require source -- npm installed first
  try {
    source = require('./src/' + opt.source);
  } catch (e) {
    //try to require source from local module
    try {
      source = require(opt.cfg.dirs.sources + opt.source);
    } catch (e2) {
      err = '\n  ' + e.toString() + '\n  ' + e2.toString();
      return moduleCallback('Invalid source.' + err);
    }
  }
  //try to require destination
  try {
    destination = require('./dest/' + opt.destination);
  } catch (e) {
    //try to require destination from local module
    try {
      destination = require(opt.cfg.dirs.destinations + opt.destination);
    } catch (e2) {
      err = '\n  ' + e.toString() + '\n  ' + e2.toString();
      return moduleCallback('Invalid destination.' + err);
    }
  }

  async.waterfall([
    //setup opfile
    function(cb) {
      outputFile(opt, function(err, opfile) {
        if (err) return moduleCallback(err);
        opt.opfile = opfile;
        cb(null);
      });
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
          if (rows == 0) return cb('No data returned from source.');
          cb(null);
        });
      } catch (e) {
        console.trace(e);
      }
    },
    //attempt to get column definitions
    function(cb) {
      colParser(opt.opfile, function(err, parsedCols) {
        if (err) return cb(err);
        cb(null, parsedCols);
      });
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
      });
    }
  ], function(err) {
    //try and clean up the output file and stop spinner
    try {
      opt.opfile.clean();
    } catch (e) {
      if (typeof(opfile) !== 'undefined') opt.log.error(e);
    }
    //error handling
    if (err) {
      opt.log.error(err);
      opt.log.error(opt.timer.str());
      return moduleCallback(err);
    }
    //success! log and return response object
    opt.log.group('Finished Bridge').log(opt.timer.str());
    opt.log.log('Completed ' + opt.source + ' ' + opt.table + ' to ' + opt.destination + '.');
    //response.check() returns null if no problem
    opt.log.log(JSON.stringify(response.strip(), null, 2));
    if (opt.spinner) opt.spinner.stop(true);
    return moduleCallback(response.check(), response);
  });
};
