/**
 * Output as CSV to /output/csv/
 * Removes any existing commas before converting
 * output file to csv.
 */
module.exports = function(options, opfile, columns, log, timer, moduleCallback) {
  var table = options.source + '.' + options.table,
    fs = require('graceful-fs'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    Stream = require('stream');

  log.group('CSV Output').log('Copying file from opfile tmp to output/csv/' + table + '.csv');

  async.waterfall([
    function(cb) {
      mkdirp('./output/csv/', function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    function(cb) {
      fs.readFile(opfile.filename, 'utf-8', function(err, data) {
        if (err) return cb(err);
        cb(null, data);
      })
    },
    function(data, cb) {
      //streaming data from outputFile to CSV
      var tab2CommaStream = new Stream.Transform();
      tab2CommaStream._transform = function(chunk, encoding, done) {
          var data = chunk.toString().replace(/,/g, '').replace(/\t/g, ',');
          this.push(data);
          done();
        }
        //pipe data
      var opfileRStream = opfile.createReadStream();
      var outputCSVStream = fs.createWriteStream('./output/csv/' + table + '.csv');
      outputCSVStream.on('error', function(err) {
        cb(err);
      })
      outputCSVStream.on('finish', function() {
        cb(null);
      })
      opfileRStream.pipe(tab2CommaStream).pipe(outputCSVStream);
      /*fs.writeFile('./output/csv/' + table + '.csv', data.replace(/,/g, '').replace(/\t/g, ','), 'utf-8', function(err) {
        if (err) return cb(err);
        log.log('Copied file, removed all , and then replaced tabs with commas.');
        cb(null);
      });*/
      //fs.writeFileSync('./output/csv/' + table + '.csv', data.replace(/,/g, '').replace(/\t/g, ','));
      //log.log('Copied file, removed all commas and replaces tabs with commas.');
      //cb(null);
    }
  ], function(err) {
    if (err) return moduleCallback(err);
    moduleCallback(null, opfile);
  })
}
