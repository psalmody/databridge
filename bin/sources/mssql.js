module.exports = function(options, spinner, moduleCallback) {
  var mssql = require('mssql'),
    async = require('async'),
    mySqlCreds = require('../../creds/mssql'),
    fs = require('fs'),
    table = options.table.indexOf('.') > -1 ? options.table : 'dbo.' + options.table,
    schema = table.split('.')[0],
    log = require('../log')(options.source + '.' + table),
    timer = require('../timer'),
    allBinds = require('../../input/binds'),
    bindQuery = require('../bindQuery'),
    query = '',
    binds = {},
    outputFile = require('../outputFile'),
    db = options.source;

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
      fs.readFile('input/mssql/' + table + '.sql', 'utf-8', function(err, data) {
        if (err) return cb('fs readFile error on input query: ' + err);
        cb(null, data);
      })
    },
    //format query and bind variables
    function(data, cb) {
      log.group('Setup').log('Processing query ' + table);
      var = (typeof(options.binds) !== 'undefined') ? true: false;
      bindQuery(data, allBinds, defs, spinner, function(err, sql, binds) {
        log.group('Binds').log(JSON.stringify(binds));
        if (err) return cb(err);
        cb(null, sql);
      })
    },
    //create output file
    function(sql, cb) {
      outputFile(table, function(err, opfile) {
        if (err) return cb(err);
        cb(null, sql, opfile);
      })
    },
    //run query
    function(sql, opfile, cb) {
      log.group('mssql').log('Running query from MSSQL');
      var request = new mssql.Request();
      request.stream = true;
      request.query(sql);
      request.on('recordset', function(columns) {
        console.log(columns);
      })
      request.on('row');
      request.on('error', function(err) {
        cb(err);
      });
      request.on('done', function(affected) {
        log.log('Rows: ' + affected);
        cb(null, opfile);
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
    log.group('Finished').log(timer.now.str());
    moduleCallback(null, opfile, log, timer);
  })
}
