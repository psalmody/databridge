module.exports = function(opt, moduleCallback) {

  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source);

  var creds = require(opt.cfg.dirs.creds + 'rptp'),
    oracle = require('oracledb'),
    async = require('async'),
    fs = require('fs'),
    table = opt.table,
    log = opt.log,
    stringify = require('csv-stringify'),
    allBinds = opt.cfg.defaultBindVars,
    bindQuery = require(opt.bin + 'bind-query'),
    query = '',
    binds = {},
    rptp,
    opfile = opt.opfile,
    timer = opt.timer;


  async.waterfall([
      //connect to database
      function(cb) {
        oracle.getConnection(creds, function(err, conn) {
          if (err) return cb(err);
          rptp = conn;
          cb(null);
        })
      },
      //read query
      function(cb) {
        fs.readFile(opt.cfg.dirs.input + opt.source + '/' + table + '.sql', 'utf-8', function(err, data) {
          if (err) return cb("fs readFile error on input query: " + err);
          cb(null, data);
        })
      },
      //format query and prompt for binds
      function(data, cb) {
        log.group('Setup').log('Processing query ' + table);
        bindQuery(data, opt, function(err, sql, binds) {
          log.group('Binds').log(JSON.stringify(binds));
          if (err) return cb(err);
          cb(null, sql);
        })
      },
      //run query
      function(sql, cb) {
        log.group('rptp').log('Selecting data from RPTP');
        rptp.execute(sql, [], {
          resultSet: true,
          prefetchRows: 10000
        }, function(err, results) {
          if (err) return cb("RPTP SELECT query error: " + err);
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
              if (err) return cb("RPTP resultSet.getRows() error: " + err);
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
                cb(null, rowsProcessed, columns);

              });

            });
          };


        })
      }
    ],
    function(err, rows, columns) {
      if (err) {
        log.error(err);
        try {
          rptp.release(function(err) {});
        } catch (e) {
          log.error(e);
        }
        return moduleCallback(err);
      }
      log.group('Finished source').log(timer.now.str());
      moduleCallback(null, rows, columns);
    })
}
