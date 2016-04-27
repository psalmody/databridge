module.exports = function(opt, moduleCallback) {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for source mysql.');

  var mysql = require('mysql'),
    creds = require(opt.cfg.dirs.creds + 'mysql'),
    async = require('async'),
    fs = require('fs'),
    prependFile = require('prepend-file'),
    db = mysql.createConnection(creds),
    table = opt.table,
    opfile = opt.opfile,
    log = opt.log,
    timer = opt.timer,
    allBinds = opt.cfg.defaultBindVars,
    bindQuery = require(opt.bin + 'bind-query'),
    query = fs.readFileSync(opt.cfg.dirs.input + opt.source + '/' + table + '.sql', 'utf-8'),
    binds = {};

  async.waterfall([
    function(cb) {
      log.group('MySQL').log('Processing query ' + table);
      var defs = (typeof(opt.binds) !== 'undefined') ? true : false;
      bindQuery(query, opt, function(err, sql, binds) {
        log.group('Binds').log(JSON.stringify(binds));
        if (err) return cb(err);
        cb(null, sql);
      })
    },
    function(sql, cb) {
      log.group('MySQL').log('Running query from MySQL');
      var query = db.query(sql);
      var opfileWriteStream = opfile.createWriteStream();
      var rowsProcessed = 0;
      var columns = [];
      query.on('error', function(err) {
          cb(err);
        })
        .on('fields', function(fields) {
          fields.forEach(function(field) {
            columns.push(field.name);
          });
        })
        .on('result', function(row) {
          var vals = [];
          for (key in row) {
            vals.push(row[key]);
          }
          rowsProcessed++;
          opfileWriteStream.write(vals.join('\t') + '\n');
        })
        .on('end', function() {
          opfileWriteStream.end();
          log.log('Rows: ' + rowsProcessed);
          cb(null, rowsProcessed, columns);
        })
    },
    function(rows, columns, cb) {
      var colstring = columns.join('\t') + '\n';
      prependFile(opfile.filename, colstring, function(err) {
        if (err) return cb(err);
        log.log('prependFile columns');
        cb(null, rows, columns);
      })
    }
  ], function(err, rows, columns) {
    db.end(function(err) {
      if (err) return moduleCallback(err);
    })
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    log.group('Finished source').log(timer.now.str());
    moduleCallback(null, rows, columns);
  })

}
