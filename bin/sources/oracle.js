module.exports = function(options, spinner, moduleCallback) {
  var oracledb = require('oracledb'),
    async = require('async'),
    fs = require('fs'),
    table = options.table,
    log = require('../log')(options.source + '.' + table),
    timer = require('../timer'),
    stringify = require('csv-stringify'),
    creds = require('../../creds/oracle'),
    allBinds = require('../../input/binds'),
    bindQuery = require('../bindQuery'),
    outputFile = require('../outputFile'),
    db,
    query = '',
    binds = {};

  async.waterfall([
      //connect to oracle
      function(cb) {
        oracledb.getConnection(creds, function(err, conn) {
          db = conn;
          if (err) return cb("OracleDB connection error: " + err);
          cb(null);
        })
      },
      //read query
      function(cb) {
        log.group('readquery');
        fs.readFile('input/oracle/' + table + '.sql', 'utf-8', function(err, data) {
          if (err) return cb("fs readFile error on input query: " + err);
          cb(null, data);
        })
      },
      //format query and prompt for binds
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
        log.group('oracle').log('Selecting data from OracleDB');
        db.execute(sql, [], {
          resultSet: true,
          prefetchRows: 10000
        }, function(err, results) {
          if (err) return cb("Oracle SELECT query error: " + err);
          var columnDefs = results.metaData,
            rowsProcessed = 0,
            columns = [];

          for (var i = 0; i < columnDefs.length; i++) {
            columns.push(columnDefs[i].name);
          }

          opfile.append(columns.join('\t') + '\n', function(err) {
            if (err) return cb(err);
            processResultSet();
          });


          function processResultSet() {
            results.resultSet.getRows(500, function(err, rows) {
              if (err) return cb("Oracle resultSet.getRows() error: " + err);
              if (rows.length) {
                rowsProcessed += rows.length;
                stringify(rows, {
                  delimiter: '\t'
                }, function(err, csv) {
                  if (err) return cb("csv-stringify error: " + err);
                  opfile.append(csv, function(err) {
                    if (err) return cb("fs.writeFile error: " + err);
                    processResultSet(); //try to get more rows from the result set
                  });
                });
                return;
              }

              log.log('Finish processing ' + rowsProcessed + ' rows');
              log.log(timer.now.str());

              results.resultSet.close(function(err) {
                if (err) return cb('Closing resultSet error: ' + err);
                cb(null, opfile);

              });

            });
          };


        })
      }
    ],
    function(err, opfile) {
      if (err) {
        log.error(err);
        try {
          db.release(function(err) {});
        } catch (e) {
          log.error(e);
        }
        return moduleCallback(err);
      }
      log.group('Finished').log(timer.now.str());
      moduleCallback(null, opfile, log, timer);
    })
}
