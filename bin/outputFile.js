module.exports = function(opts, callback) {

  if (typeof(opts) == 'undefined') return callback('No options specified.');

  var opts = typeof(opts) == 'string' ? {
    table: opts
  } : opts;

  var FILE = new Object(),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    dt = new Date(),
    dirname = __dirname.replace(/\\/g, '/'),
    dir = dirname + '/../output/';

  FILE.filename = typeof(opts.filename) == 'undefined' ? dir + opts.table + '.' + Math.round(Date.now() / 1000) + '.csv' : opts.filename;

  FILE.clean = function(cb) {
    var cb = typeof(cb) == 'undefined' ? function() {
      return;
    } : cb;
    //don't cleanup csv files loaded by user
    if (typeof(opts.filename) !== 'undefined') return cb();
    fs.unlink(FILE.filename, function(err) {
      if (err) return cb(err);
      cb(null, true);
    })
  }

  FILE.append = function(data, cb) {
    var cb = typeof(cb) == 'undefined' ? function() {
      return;
    } : cb;
    if (typeof(opts.filename) !== 'undefined') return cb();
    fs.appendFile(FILE.filename, data, function(err) {
      if (err) return cb(err);
      cb(null);
    })
  }

  FILE.twoLines = function(cb) {
    var cb = typeof(cb) == 'undefined' ? function() {
      return;
    } : cb;
    fs.readFile(FILE.filename, 'utf-8', function(err, data) {
      if (err) return cb(err);
      var two = data.split('\n').slice(0, 2);
      cb(null, two);
    })
  }

  //if filename isn't specified, then create file/directory
  if (typeof(opts.filename) == 'undefined') {
    mkdirp(dir, function(err) {
      if (err) {
        console.log(err);
        return callback(err);
      }
      fs.open(FILE.filename, 'w', function(err, fd) {
        if (err) {
          console.log(err);
          return callback(err);
        }
        callback(null, FILE);
      })
    })
  } else {
    callback(null, FILE);
  }




}
