module.exports = function(options, spinner, callback) {
  //TODO change this to tab-delimited source and create real csv source
  var fs = require('fs'),
    async = require('async'),
    file = options.table,
    filename = __dirname.replace(/\\/g, '/') + '/../../input/csv/' + file + '.csv',
    log = require('../log')(file),
    timer = require('../timer'),
    outputFile = require('../outputFile');

  async.waterfall([
    function(cb) {
      outputFile({
        table: file,
        filename: filename
      }, function(err, opfile) {
        if (err) return cb(err);
        cb(null, opfile);
      })
    },
    function(opfile, cb) {
      fs.stat(opfile.filename, function(err, res) {
        if (err) return cb(err);
        if (res.size) return cb(null, opfile);
        cb('File has no data or doesn\'t exist');
      })
    }
  ], function(err, opfile) {
    if (err) {
      log.error(err);
      return callback(err);
    }
    log.group('Finished').log(timer.now.str());
    callback(null, opfile, log, timer);
  })

}
