module.exports = function(opts, moduleCallback) {
  //options are required
  if (typeof(opts) == 'undefined') return moduleCallback('No options specified.');
  //if opts is a string, assume it's the table name
  var opts = typeof(opts) == 'string' ? {
    table: opts
  } : opts;
  //setup and require
  var FILE = new Object(),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    dt = new Date(),
    dirname = __dirname.replace(/\\/g, '/'),
    dir = dirname + '/../output/';

  //filename stores the complete filename for writing to later
  FILE.filename = typeof(opts.filename) == 'undefined' ? dir + opts.table + '.' + Math.round(Date.now() / 1000) + '.csv' : opts.filename;

  //cleanup (remove) output file
  FILE.clean = function(callback) {
    //define callback
    var callback = typeof(callback) == 'undefined' ? function() {
      return;
    } : callback;
    //don't cleanup csv files loaded by user
    if (typeof(opts.filename) !== 'undefined') return callback();
    //delete file
    fs.unlink(FILE.filename, function(err) {
      if (err) return callback(err);
      callback(null, true);
    })
  }

  //append function - append data to file
  FILE.append = function(data, callback) {
    var callback = typeof(callback) == 'undefined' ? function() {
      return;
    } : callback;
    //don't accidentally append data to user loaded csv file
    if (typeof(opts.filename) !== 'undefined') return callback('Won\'t append to pre-existing file.');
    //append data and return callback
    fs.appendFile(FILE.filename, data, function(err) {
      if (err) return callback(err);
      callback(null);
    })
  }

  //get first two lines of data for column definitions
  FILE.twoLines = function(callback) {
    var callback = typeof(callback) == 'undefined' ? function() {
      return;
    } : callback;
    fs.readFile(FILE.filename, 'utf-8', function(err, data) {
      if (err) return callback(err);
      var two = data.split('\n').slice(0, 2);
      callback(null, two);
    })
  }

  //if filename isn't specified, then create file/directory
  if (typeof(opts.filename) == 'undefined') {
    mkdirp(dir, function(err) {
      if (err) {
        console.log(err);
        return moduleCallback(err);
      }
      //create file
      fs.open(FILE.filename, 'w', function(err, fd) {
        if (err) {
          console.log(err);
          return moduleCallback(err);
        }
        //close it now that it's created
        fs.close(fd, function(err) {
          if (err) {
            console.log(err);
            return moduleCallback(err);
          }
          moduleCallback(null, FILE);
        })
      })
    })
  } else {
    moduleCallback(null, FILE);
  }
}
