module.exports = function(table, callback) {

  var outputFile = new Object(),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    dt = new Date(),
    dirname = __dirname.replace(/\\/g, '/'),
    dir = dirname + '/../output/';

  outputFile.filename = dir + table + '.' + Math.round(Date.now() / 1000) + '.csv';

  outputFile.clean = function(cb) {
    var cb = typeof(cb) == 'undefined' ? false : cb;
    fs.unlink(outputFile.filename, function(err) {
      if (err) return cb(err);
      if (err && !cb) console.log(err);
      if (cb) cb(null, true);
    })
  }

  outputFile.append = function(data, cb) {
    var cb = typeof(cb) == 'undefined' ? false : cb;
    fs.appendFile(outputFile.filename, data, function(err) {
      if (err && cb) return cb(err);
      if (err && !cb) console.log(err);
      if (cb) cb(null);
    })
  }

  outputFile.twoLines = function(cb) {
    var cb = typeof(cb) == 'undefined' ? false : cb;
    fs.readFile(outputFile.filename, 'utf-8', function(err, data) {
      if (err) return cb(err);
      if (err && !cb) console.log(err);
      var two = data.split('\n').slice(0, 2);
      if (cb) cb(null, two);
    })
  }


  mkdirp(dir, function(err) {
    if (err) {
      console.log(err);
      return callback(err);
    }
    fs.open(outputFile.filename, 'w', function(err, fd) {
      if (err) {
        console.log(err);
        return callback(err);
      }
      callback(null, outputFile);
    })
  })



}
