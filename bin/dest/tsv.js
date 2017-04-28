/**
 * Output as TSV (.txt) to /output/tsv/
 */
module.exports = function(opt, columns, moduleCallback) {

  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);

  var table = opt.source + '.' + opt.table,
    fs = require('graceful-fs'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    Stream = require('stream'),
    split = require('split'),
    opfile = opt.opfile,
    outputFile = opt.cfg.dirs.output + 'tsv/' + dir + '/' + table + '.txt';

  async.waterfall([
    function(cb) {
      mkdirp(opt.cfg.dirs.output + 'tsv/' + dir, function(err) {
        if (err) return cb(err);
        cb(null);
      });
    },
    function(cb) {
      var rowsProcessed = 0;
      var first = true;
      var columns;
      var rStream = opfile.createReadStream();
      var oStream = fs.createWriteStream(outputFile);
      var tStream = new Stream.Transform();
      tStream._transform = function(chunk, encoding, callback) {
        if (chunk.toString().trim() == '') {
          this.push('');
          return callback();
        }
        if (!first) rowsProcessed++;
        if (first) {
          columns = chunk.toString().replace(/_IND/g, '').split('\t');
          first = false;
        }
        var data = chunk.toString().replace(/_IND/g, '');
        this.push(data + '\n');
        callback();
      };
      oStream.on('error', function(err) {
        cb(err);
      });
      oStream.on('finish', function() {
        cb(null, rowsProcessed, columns);
      });
      rStream.pipe(split()).pipe(tStream).pipe(oStream);
    }
  ], function(err, rows, columns) {
    if (err) return moduleCallback(err);
    moduleCallback(null, rows, columns);
  });
};
