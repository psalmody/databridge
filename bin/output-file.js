/**
 * handles the output file created for data between
 * source and destination
 */
module.exports = function(opt, moduleCallback) {
  //options are required
  if (typeof(opt) == 'undefined') return moduleCallback('No options specified.');
  //setup and require
  var FILE = new Object(),
    fs = require('graceful-fs'),
    dt = new Date();

  dir = opt.cfg.dirs.output;

  //filename stores the complete filename for writing to later
  FILE.filename = dir + opt.table + '.' + Math.round(Date.now() / 1000) + '.dat';

  //cleanup (remove) output file
  FILE.clean = function(callback) {
    //define callback
    var callback = typeof(callback) == 'undefined' ? function() {
      return;
    } : callback;
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
    //append data and return callback
    fs.appendFile(FILE.filename, data, function(err) {
      if (err) return callback(err);
      callback(null);
    })
  }

  //get first line for column titles


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

  //stream options
  FILE.createWriteStream = function() {
    return fs.createWriteStream(FILE.filename);
  }
  FILE.createReadStream = function() {
    return fs.createReadStream(FILE.filename);
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
}
