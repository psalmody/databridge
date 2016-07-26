/**
 * Output as JSON (pretty) to /output/json/
 */
module.exports = function(opt, columns, moduleCallback) {
  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);

  var table = opt.source + '.' + opt.table,
    fs = require('graceful-fs'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    Stream = require('stream'),
    keys = [],
    split = require('split'),
    opfile = opt.opfile,
    log = opt.log,
    timer = opt.timer;

  for (var i = 0; i < columns.length; i++) {
    keys.push(columns[i].name);
  }

  log.group('JSON Output').log('Copying file (and transformining) to output/json/' + dir + '/' + table + '.json');

  async.waterfall([
    function(cb) {
      log.log('Making directory for json output.');
      mkdirp(opt.cfg.dirs.output + 'json/' + dir, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    function(cb) {
      log.log('Transforming data from opfile to json.');
      var first = true;
      var second = true;
      var rowsProcessed = 0;
      var tab2JSONStream = new Stream.Transform();
      tab2JSONStream._transform = function(chunk, encoding, callback) {
        //skip first row (columns)
        if (first) {
          first = false;
          return callback();
        }

        //only put new line and comma before each row (except first data row)
        var str = (second) ? '' : ',\n';
        if (second) second = false;
        //handle windows \r return
        var values = chunk.toString().replace(/\r/g, '').split('\t');
        //handle blanks lines
        if (values.length !== keys.length) return callback();
        rowsProcessed++;
        var data = {};
        for (var i = 0; i < values.length; i++) {
          data[keys[i]] = values[i];
        }
        this.push(str + JSON.stringify(data, null, 2));
        callback();
      };
      tab2JSONStream.on('error', function(err) {
        cb(err);
      })
      var opfileRStream = opfile.createReadStream();
      var outputJSONStream = fs.createWriteStream(opt.cfg.dirs.output + 'json/' + dir + '/' + table + '.json');
      outputJSONStream.on('error', function(err) {
        cb(err);
      })
      outputJSONStream.on('finish', function() {
        fs.appendFile(opt.cfg.dirs.output + 'json/' + dir + '/' + table + '.json', ']', function(err) {
          if (err) return cb(err);
          cb(null, rowsProcessed);
        });
      })
      outputJSONStream.write('[');
      opfileRStream.pipe(split()).pipe(tab2JSONStream).pipe(outputJSONStream);

    }
  ], function(err, rows) {
    if (err) return moduleCallback(err);
    moduleCallback(null, rows, keys);
  })
}
