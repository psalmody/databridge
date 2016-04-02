module.exports = function(options, spinner, moduleCallback) {

  var fs = require('fs'),
    async = require('async'),
    file = options.table,
    filename = __dirname.replace(/\\/g, '/') + '/../../input/csv/' + file + '.csv',
    log = require('../log')(file, options.batch),
    timer = require('../timer'),
    outputFile = require('../outputFile');

  async.waterfall([
    function(cb) {
      outputFile(file, function(err, opfile) {
        if (err) return cb(err);
        cb(null, opfile);
      })
    },
    //make sure csv has data
    function(opfile, cb) {
      fs.stat(filename, function(err, res) {
        if (err) return cb(err);
        if (res.size) return cb(null, opfile);
        cb('File has no data or doesn\'t exist');
      })
    },
    //read data and change to tab-delimited
    function(opfile, cb) {
      fs.readFile(filename, 'utf-8', function(err, data) {
        if (err) return cb(err);
        cb(null, opfile, data.replace(/,/g,'\t'));
      })
    },
    //write data to opfile
    function(opfile, data, cb) {
      opfile.append(data, function(err) {
        if (err) return cb(err);
        cb(null, opfile);
      })
    }
  ], function(err, opfile) {
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    log.group('Finished').log(timer.now.str());
    moduleCallback(null, opfile, log, timer);
  })

}
