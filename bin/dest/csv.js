/**
 * Output as CSV to /output/csv/
 * Removes any existing commas before converting
 * output file to csv.
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
    log = opt.log,
    opfile = opt.opfile,
    timer = opt.timer;

  log.group('CSV Output').log('Copying file from opfile tmp to output/csv/' + dir + '/' + table + '.csv');

  async.waterfall([
    function(cb) {
      log.log('Creating directory');
      mkdirp(opt.cfg.dirs.output + 'csv/' + dir, function(err) {
        if (err) return cb(err);
        cb(null);
      });
    },
    function(cb) {
      log.log('Streaming from opfile to new csv file...');
      var rowsProcessed = 0;
      //get columns
      var first = true;
      var columns;
      //streaming data from outputFile to CSV
      var tab2CommaStream = new Stream.Transform();
      tab2CommaStream._transform = function(chunk, encoding, callback) {
        if (chunk.toString().trim() == '') {
          this.push('');
          return callback();
        }
        if (!first) rowsProcessed++;
        if (first) {
          columns = chunk.toString().replace(/,|_IND/g, '').split('\t');
          first = false;
        }
        var data = chunk.toString().replace(/,|_IND/g, '').replace(/\t/g, ',');
        this.push(data + '\n');
        callback();
      };
      //pipe data
      var opfileRStream = opfile.createReadStream();
      var outputCSVStream = fs.createWriteStream(opt.cfg.dirs.output + 'csv/' + dir + '/' + table + '.csv');
      outputCSVStream.on('error', function(err) {
        cb(err);
      });
      outputCSVStream.on('finish', function() {
        cb(null, rowsProcessed, columns);
      });
      opfileRStream.pipe(split()).pipe(tab2CommaStream).pipe(outputCSVStream);
    }
  ], function(err, rows, columns) {
    if (err) return moduleCallback(err);
    log.group('Finished destination').log(timer.str());
    moduleCallback(null, rows, columns);
  });
};
