module.exports = function(args, callback) {
  var oracledb = require('oracledb'),
    async = require('async'),
    fs = require('fs'),
    table = args[3],
    log = require('../log')(args[2]+'.'+table),
    timer = require('../timer'),
    stringify = require('csv-stringify'),
    creds = require('../../creds/oracle'),
    allBinds = require('../../binds'),
    bindQuery = require('../bindQuery'),
    outputFile = require('../outputFile'),
    db,
    query = '',
    binds = {},
    colors = require('colors/safe');

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
        //TODO change to allow a usedefaults flag at command line
        bindQuery(data, allBinds, false, function(err, sql, binds) {
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
            //log.log('processResultSet() time: ' + ((Date.now() - startTime) / 1000));
            results.resultSet.getRows(500, function(err, rows) {
              if (err) return cb("Oracle resultSet.getRows() error: " + err);
              /*if (rowsProcessed == 0 && rows.length) {
                //column defs will be processed by app.js
                for (var i = 0; i < columnDefs.length; i++) {
                  columnDefs[i].type = typeof(rows[0][i]);
                  if (columnDefs[i].name.indexOf('_IND') !== -1) {
                    columnDefs[i].name = columnDefs[i].name.replace('_IND', '');
                    columnDefs[i].index = true;
                  }
                }*/

              if (rows.length) {
                rowsProcessed += rows.length;
                stringify(rows, {
                  delimiter: '\t',
                  quoted: true,
                  quotedEmpty: true
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
        return callback(err);
      }
      log.group('Finished').log(timer.now.str());
      callback(null, opfile, log, timer);
    })
}
