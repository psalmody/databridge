module.exports = function(opt, moduleCallback) {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source);

  var fs = require('fs'),
    async = require('async'),
    Stream = require('stream'),
    split = require('split'),
    file = opt.table,
    filename = opt.cfg.dirs.input + 'tsv/' + file + '.txt',
    log = opt.log,
    opfile = opt.opfile;

  async.waterfall([
    function(cb) {
      fs.stat(filename, function(err, res) {
        if (err) return cb(err);
        if (res.size) return cb(null);
        cb('File has no data or doesn\'t exist');
      });
    },
    function(cb) {
      var rowsProcessed = 0;
      var first = true;
      var columns;
      var tStream = new Stream.Transform();
      tStream._transform = function(chunk, encoding, done) {
        //skip blank rows
        if (chunk.toString().trim() == '') return done();
        if (first) {
          first = false;
          columns = chunk.toString().replace(/\r/g, '').split('\t');
        } else {
          rowsProcessed++;
        }
        var data = chunk.toString().replace(/\r/, '');
        this.push(data + '\n');
        done();
      };
      //pipe data from csv to output file
      var oStream = opfile.writeStream;
      var rStream = fs.createReadStream(filename);
      oStream.on('error', function(err) {
        cb(err);
      });
      oStream.on('finish', function() {
        cb(null, rowsProcessed, columns);
      });
      rStream.pipe(split()).pipe(tStream).pipe(oStream);
    }
  ], function(err, rows, columns) {
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    moduleCallback(null, rows, columns);
  });
};
