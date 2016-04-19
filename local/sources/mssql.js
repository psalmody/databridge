module.exports = function(opt, moduleCallback) {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source);
  var mssql = require('mssql'),
    async = require('async'),
    creds = require(opt.cfg.dirs.creds + 'mssql'),
    fs = require('fs'),
    table = opt.table.indexOf('.') > -1 ? opt.table : 'dbo.' + opt.table,
    schema = table.split('.')[0],
    log = opt.log,
    allBinds = opt.cfg.defaultBindVars,
    bindQuery = require(opt.bin + 'bind-query'),
    query = '',
    binds = {},
    db = opt.source,
    spinner = opt.spinner,
    opfile = opt.opfile,
    timer = opt.timer,
    prependFile = require('prepend-file');

  async.waterfall([
    function(cb) {
      mssql.connect(creds).then(function() {
        log.group('mssql').log('connected to mssql');
        cb(null);
      }).catch(function(err) {
        cb(err);
      })
    },
    function(cb) {
      log.group('readquery');
      fs.readFile(opt.cfg.dirs.input + opt.source + '/' + table + '.sql', 'utf-8', function(err, data) {
        if (err) return cb('fs readFile error on input query: ' + err);
        cb(null, data);
      })
    },
    //format query and bind variables
    function(data, cb) {
      log.group('Setup').log('Processing query ' + table);
      var defs = (typeof(opt.binds) !== 'undefined') ? true : false;
      bindQuery(data, opt, function(err, sql, binds) {
        log.group('Binds').log(JSON.stringify(binds));
        if (err) return cb(err);
        cb(null, sql);
      })
    },
    //run query
    function(sql, cb) {
      log.group('mssql').log('Running query from MSSQL');
      var request = new mssql.Request();

      var columns = '';
      var rowsProcessed = 0;

      //trying stream for opfile
      var opfileWStream = opfile.createWriteStream();

      request.stream = true;
      request.query(sql);
      request.on('recordset', function(cols) {
        var str = '',
          colnames = Object.keys(cols);
        columns = colnames.join('\t') + '\n';
      })
      request.on('row', function(row) {
        var vals = [];
        for (key in row) {
          vals.push(row[key]);
        }
        rowsProcessed++;
        opfileWStream.write(vals.join('\t') + '\n');

      });
      request.on('error', function(err) {
        cb(err);
      });
      request.on('done', function(affected) {

        opfileWStream.end();
        log.log('Rows: ' + rowsProcessed);
        cb(null, columns);
      })
    },
    //prepend columns
    function(columns, cb) {
      prependFile(opfile.filename, columns, function(err) {
        if (err) return cb(err);
        log.log('prependFile columns');
        cb(null);
      })
    }
  ], function(err, opfile) {
    if (err) {
      log.error(err);
      try {
        mssql.close();
      } catch (e) {
        log.error(e);
      }
      return moduleCallback(err);
    }
    log.group('Finished source').log(timer.now.str());
    moduleCallback(null);
  })
}
