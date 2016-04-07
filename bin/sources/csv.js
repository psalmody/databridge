module.exports = function(options, spinner, moduleCallback) {

  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);


  var fs = require('fs'),
    async = require('async'),
    file = options.table,
    filename = __dirname.replace(/\\/g, '/') + '/../../input/csv/' + dir + '/' + file + '.csv',
    log = require('../log')(file, options.batch),
    timer = require('../timer'),
    outputFile = require('../outputFile'),
    Stream = require('stream');

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
      //creating through stream to format data
      var comma2TabStream = new Stream.Transform();
      comma2TabStream._transform = function(chunk, encoding, done) {
          var data = chunk.toString().replace(/,/g, '\t');
          this.push(data);
          done();
        }
        //pipe data from csv to output file
      var opfileWStream = opfile.createWriteStream();
      var readCSVStream = fs.createReadStream(filename);

      opfileWStream.on('error', function(err) {
        cb(err);
      })
      opfileWStream.on('finish', function() {
        cb(null, opfile);
      })
      readCSVStream.pipe(comma2TabStream).pipe(opfileWStream);
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
