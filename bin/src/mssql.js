module.exports = function(opt, moduleCallback) {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source);
  var mssql = require('mssql'),
    async = require('async'),
    creds = require(opt.cfg.dirs.creds + opt.source),
    fs = require('fs'),
    table = opt.table.indexOf('.') > -1 ? opt.table : 'dbo.' + opt.table,
    log = opt.log,
    bindQuery = require(opt.bin + 'bind-query'),
    opfile = opt.opfile,
    prependFile = require('prepend-file');

  async.waterfall([
    function(cb) {
      mssql.connect(creds).then(function() {
        cb(null);
      }).catch(function(err) {
        cb(err);
      });
    },
    function(cb) {
      fs.readFile(opt.cfg.dirs.input + opt.source + '/' + table + '.sql', 'utf-8', function(err, data) {
        if (err) return cb('fs readFile error on input query: ' + err);
        cb(null, data);
      });
    },
    //format query and bind variables
    function(data, cb) {
      bindQuery(data, opt, function(err, sql) {
        if (err) return cb(err);
        cb(null, sql);
      });
    },
    //run query
    function(sql, cb) {
      var request = new mssql.Request();

      var columns = '';
      var rowsProcessed = 0;

      //trying stream for opfile
      var opfileWStream = opfile.createWriteStream();

      request.stream = true;
      request.query(sql);
      request.on('recordset', function(cols) {
        var colnames = Object.keys(cols);
        columns = colnames.join('\t') + '\n';
      });
      request.on('row', function(row) {
        var vals = [];
        for (var key in row) {
          vals.push(row[key]);
        }
        rowsProcessed++;
        opfileWStream.write(vals.join('\t').replace(/\n|\r/g, '') + '\n');
      });
      request.on('error', function(err) {
        cb(err);
      });
      request.on('done', function() {
        opfileWStream.end();
        cb(null, rowsProcessed, columns);
      });
    },
    //prepend columns
    function(rows, columns, cb) {
      prependFile(opfile.filename, columns, function(err) {
        if (err) return cb(err);
        cb(null, rows, columns.replace(/\n|_IND|_DEC/g, '').split('\t'));
      });
    }
  ], function(err, rows, columns) {
    try {
      mssql.close();
    } catch (e) {
      log.error(e);
    }
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    moduleCallback(null, rows, columns);
  });
};
