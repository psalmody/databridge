module.exports = function(opt, moduleCallback) {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source);

  var fs = require('fs'),
    async = require('async'),
    Stream = require('stream'),
    split = require('split'),
    file = opt.table,
    filename = opt.cfg.dirs.input + 'csv/' + file + '.csv',
    log = opt.log,
    timer = opt.timer,
    opfile = opt.opfile;

  async.waterfall([
    //make sure csv has data
    function(cb) {
      fs.stat(filename, function(err, res) {
        if (err) return cb(err);
        if (res.size) return cb(null);
        cb('File has no data or doesn\'t exist');
      })
    },
    //read data and change to tab-delimited
    function(cb) {
      var rowsProcessed = 0;
      var first = true;
      var columns;
      //creating through stream to format data
      var comma2TabStream = new Stream.Transform();
      comma2TabStream._transform = function(chunk, encoding, done) {
          //skip blank rows
          if (chunk.toString().trim() == '') return done();
          if (first) {
            first = false;
            columns = chunk.toString().replace(/\r/g, '').split(',');
          } else {
            rowsProcessed++;
          }
          //TODO only replace , outside "" using some kind
          // of regex like /(,)(?=(?:[^"]|"[^"]*")*$)/g
          var data = chunk.toString().replace(/,/g, '\t').replace(/\r/g, '');
          this.push(data + '\n');
          done();
        }
        //pipe data from csv to output file
      var opfileWStream = opfile.createWriteStream();
      var readCSVStream = fs.createReadStream(filename);

      opfileWStream.on('error', function(err) {
        cb(err);
      })
      opfileWStream.on('finish', function() {
        cb(null, rowsProcessed, columns);
      })
      readCSVStream.pipe(split()).pipe(comma2TabStream).pipe(opfileWStream);
    }
  ], function(err, rows, columns) {
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    log.group('Finished source').log(timer.now.str());
    moduleCallback(null, rows, columns);
  })

}
