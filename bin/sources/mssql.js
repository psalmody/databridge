module.exports = function(options, spinner, moduleCallback) {
  var mssql = require('mssql'),
    async = require('async'),
    creds = require('../../creds/mssql'),
    fs = require('fs'),
    table = options.table.indexOf('.') > -1 ? options.table : 'dbo.' + options.table,
    schema = table.split('.')[0],
    log = require('../log')(options.source + '.' + table, options.batch),
    timer = require('../timer'),
    allBinds = require('../../input/binds'),
    bindQuery = require('../bindQuery'),
    query = '',
    binds = {},
    outputFile = require('../outputFile'),
    db = options.source,
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
      fs.readFile('input/mssql/' + table + '.sql', 'utf-8', function(err, data) {
        if (err) return cb('fs readFile error on input query: ' + err);
        cb(null, data);
      })
    },
    //format query and bind variables
    function(data, cb) {
      log.group('Setup').log('Processing query ' + table);
      var defs = (typeof(options.binds) !== 'undefined') ? true : false;
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
        cb(null, columns, opfile);
      })
    },
    //prepend columns
    function(columns, opfile, cb) {
      prependFile(opfile.filename, columns, function(err) {
        if (err) return cb(err);
        log.log('prependFile columns');
        cb(null, opfile);
      })
    }
  ], function(err, opfile) {
    try {
      mssql.close();
    } catch (e) {
      log.error(e);
    }
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    log.group('Finished').log(timer.now.str());
    moduleCallback(null, opfile, log, timer);
  })
}
