module.exports = function(opt, moduleCallback) {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for source mysql.');

  var mysql = require('mysql'),
    creds = require(opt.cfg.dirs.creds + opt.source),
    async = require('async'),
    fs = require('fs'),
    prependFile = require('prepend-file'),
    db = mysql.createConnection(creds),
    table = opt.table,
    opfile = opt.opfile,
    log = opt.log,
    bindQuery = require(opt.bin + 'bind-query'),
    query = fs.readFileSync(opt.cfg.dirs.input + opt.source + '/' + table + '.sql', 'utf-8');

  async.waterfall([
    function(cb) {
      bindQuery(query, opt, function(err, sql) {
        if (err) return cb(err);
        cb(null, sql);
      });
    },
    function(sql, cb) {
      var query = db.query(sql);
      var opfileWriteStream = opfile.writeStream;
      var rowsProcessed = 0;
      var columns = [];
      query.on('error', function(err) {
          cb(err);
        })
        .on('fields', function(fields) {
          fields.forEach(function(field) {
            columns.push(field.name.replace(/_IND|_DEC/g, ''));
          });
        })
        .on('result', function(row) {
          var vals = [];
          for (var key in row) {
            vals.push(row[key]);
          }
          rowsProcessed++;
          opfileWriteStream.write(vals.join('\t').replace(/\n|\r/g, '') + '\n');
        })
        .on('end', function() {
          opfileWriteStream.end();
          cb(null, rowsProcessed, columns);
        });
    },
    function(rows, columns, cb) {
      var colstring = columns.join('\t') + '\n';
      prependFile(opfile.filename, colstring, function(err) {
        if (err) return cb(err);
        cb(null, rows, columns);
      });
    }
  ], function(err, rows, columns) {
    db.end(function(err) {
      if (err) return moduleCallback(err);
    });
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    moduleCallback(null, rows, columns);
  });

};
