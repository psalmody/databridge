/**
 * Output as CSV to /output/csv/
 * Removes any existing commas before converting
 * output file to csv.
 */
module.exports = function(options, opfile, columns, log, timer, moduleCallback) {

  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);

  var table = options.source + '.' + options.table,
    fs = require('graceful-fs'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    Stream = require('stream');

  log.group('CSV Output').log('Copying file from opfile tmp to output/csv/' + dir + '/' + table + '.csv');

  async.waterfall([
    function(cb) {
      mkdirp('./output/csv/' + dir, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    function(cb) {
      //streaming data from outputFile to CSV
      var tab2CommaStream = new Stream.Transform();
      tab2CommaStream._transform = function(chunk, encoding, done) {
          var data = chunk.toString().replace(/,/g, '').replace(/\t/g, ',');
          this.push(data);
          done();
        }
        //pipe data
      var opfileRStream = opfile.createReadStream();
      var outputCSVStream = fs.createWriteStream('./output/csv/' + dir + '/' + table + '.csv');
      outputCSVStream.on('error', function(err) {
        cb(err);
      })
      outputCSVStream.on('finish', function() {
        cb(null);
      })
      opfileRStream.pipe(tab2CommaStream).pipe(outputCSVStream);
    }
  ], function(err) {
    if (err) return moduleCallback(err);
    moduleCallback(null, opfile);
  })
}
