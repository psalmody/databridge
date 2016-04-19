module.exports = function(opt, moduleCallback) {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source);

  var fs = require('fs'),
    async = require('async'),
    file = opt.table,
    filename = opt.cfg.dirs.input + 'csv/' + file + '.csv',
    log = opt.log,
    timer = opt.timer,
    opfile = opt.opfile,
    Stream = require('stream');

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
      //creating through stream to format data
      var comma2TabStream = new Stream.Transform();
      comma2TabStream._transform = function(chunk, encoding, done) {
          //TODO change to line by line and only replace , outside "" using some kind
          // of regex like /(,)(?=(?:[^"]|"[^"]*")*$)/g
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
        cb(null);
      })
      readCSVStream.pipe(comma2TabStream).pipe(opfileWStream);
    }
  ], function(err) {
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    log.group('Finished source').log(timer.now.str());
    moduleCallback(null);
  })

}
