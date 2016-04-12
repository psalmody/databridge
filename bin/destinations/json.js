/**
 * Output as JSON (pretty) to /output/csv/
 */
module.exports = function(options, opfile, columns, log, timer, moduleCallback) {
  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);

  var table = options.source + '.' + options.table,
    fs = require('graceful-fs'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    Stream = require('stream'),
    keys = [],
    split = require('split');

  for (var i = 0; i < columns.length; i++) {
    keys.push(columns[i].name);
  }

  log.group('JSON Output').log('Copying file (and transformining) to output/json/' + dir + '/' + table + '.json');

  async.waterfall([
    function(cb) {
      mkdirp('./output/json/' + dir, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    function(cb) {
      var first = true;
      var second = true;
      var tab2JSONStream = new Stream.Transform();
      tab2JSONStream._transform = function(chunk, encoding, done) {
        if (first) {
          first = false;
          return done();
        }
        var str = (second) ? '' : ',\n';
        if (second) second = false;
        var values = chunk.toString().split('\t');
        if (values.length !== keys.length) return done();
        var data = {};
        for (var i = 0; i < values.length; i++) {
          data[keys[i]] = values[i];
        }
        this.push(str + JSON.stringify(data, null, 2));
        done();
      };
      tab2JSONStream.on('error', function(err) {
        cb(err);
      })
      var opfileRStream = opfile.createReadStream();
      var outputJSONStream = fs.createWriteStream('./output/json/' + dir + '/' + table + '.json');
      outputJSONStream.on('error', function(err) {
        cb(err);
      })
      outputJSONStream.on('finish', function() {
        fs.appendFile('./output/json/' + dir + '/' + table + '.json', ']', function(err) {
          if (err) return cb(err);
          cb(null);
        });
      })
      outputJSONStream.write('[');
      opfileRStream.pipe(split()).pipe(tab2JSONStream).pipe(outputJSONStream);

    }
  ], function(err) {
    if (err) return moduleCallback(err);
    moduleCallback(null, opfile);
  })

}
