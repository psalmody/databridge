module.exports = function(opt, moduleCallback) {

  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source);

  var creds = require(opt.cfg.dirs.creds + 'oracle'),
    oracle = require('oracledb'),
    async = require('async'),
    fs = require('fs'),
    table = opt.table,
    log = opt.log,
    stringify = require('csv-stringify'),
    bindQuery = require(opt.bin + 'bind-query'),
    opfile = opt.opfile;


  async.waterfall([
      //connect to database
      function(cb) {
        oracle.getConnection(creds, function(err, conn) {
          if (err) return cb(err);
          oracle = conn;
          cb(null);
        });
      },
      //read query
      function(cb) {
        var f = opt.cfg.dirs.input + opt.source + '/' + table + '.sql';
        fs.readFile(f, 'utf8', function(err, data) {
          if (err) return cb('fs readFile error on input query: ' + err);
          cb(null, data);
        });
      },
      //format query and prompt for binds
      function(data, cb) {
        try {
          bindQuery(data, opt, function(err, sql) {
            if (err) return cb(err);
            cb(null, sql);
          });
        } catch (e) {
          console.trace(e);
        }
      },
      //run query
      function(sql, cb) {
        oracle.execute(sql, [], {
          resultSet: true,
          prefetchRows: 10000
        }, function(err, results) {
          if (err) return cb('oracle SELECT query error: ' + err);
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
              if (err) return cb('oracle resultSet.getRows() error: ' + err);
              if (rows.length) {
                rowsProcessed += rows.length;
                var rs = [];
                rows.forEach(function(r) {
                  var s = [];
                  r.forEach(function(t) {
                    t = (typeof(t) == 'string') ? t.replace(/\n|\r/g, '') : t;
                    s.push(t);
                  });
                  rs.push(s);
                });
                stringify(rs, {
                  delimiter: '\t'
                }, function(err, csv) {
                  if (err) return cb('csv-stringify error: ' + err);
                  opfile.append(csv, function(err) {
                    if (err) return cb('fs.writeFile error: ' + err);
                    processResultSet(); //try to get more rows from the result set
                  });
                });
                return;
              }

              results.resultSet.close(function(err) {
                if (err) return cb('Closing resultSet error: ' + err);
                cb(null, rowsProcessed, columns);
              });
            });
          }
        });
      }
    ],
    function(err, rows, columns) {
      if (err) {
        log.error(err);
        try {
          oracle.release(function() {
            return;
          });
        } catch (e) {
          log.error(e);
        }
        return moduleCallback(err);
      }
      moduleCallback(null, rows, columns);
    });
};
