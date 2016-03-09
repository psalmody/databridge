module.exports = function(file, callback) {

  var fs = require('fs'),
    oracledb = require('oracledb'),
    mysql = require('mysql'),
    mySqlCreds = require('../creds/mysql'),
    mydb = mysql.createConnection(mySqlCreds),
    async = require('async'),
    tmp = require('tmp'),
    stringify = require('csv-stringify'),
    oraclecreds = require('../creds/oracle'),
    allBinds = require('../binds'),
    timer = require('../bin/timer'),
    dborac,
    table = 'oracle.' + file.replace('.sql', ''),
    log = require('../bin/log')(table),
    prompt = require('prompt'),
    query = '',
    binds = {},
    colors = require('colors/safe');

  prompt.message = colors.green('Enter bind variable');

  async.waterfall([
    function(cb) {
      log.group('readquery');
      //read the file select query for oracle
      fs.readFile('querys/' + file, 'utf-8', function(err, data) {
        if (err) return cb("fs readFile error on input query: " + err);

        cb(null, data);
      });
    },
    //first format query and prompt for binds
    function(data, cb) {
      log.group('Setup').log('Processing query ' + file);
      var bds = [];
      var prompts = {
        properties: {

        }
      };
      var sql = data.replace(/\/\*[.\s\S]*?\*\/|--.*?[\n\r]/g, '');
      var bindPattern = /[:].[a-z_0-9]+/g;
      while (result = bindPattern.exec(sql)) {
        var r = result[0].replace(':', '');
        if (bds.indexOf(r) == -1) bds.push(r);
      }
      for (var i = 0; i < bds.length; i++) {
        //binds[bds[i]] = allBinds[bds[i]];
        prompts.properties[bds[i]] = {
          default: allBinds[bds[i]],
          description: colors.green(bds[i])
        }
      }


      prompt.start();
      prompt.get(prompts, function(err, result) {
        log.group('Binds').log(JSON.stringify(result, null, 2));
        cb(null, result, data);
      });
    },
    function(binds, query, cb) {
      log.group('oracle-connect');
      oracledb.getConnection(oraclecreds, function(err, conn) {
        dborac = conn;
        if (err) return cb("OracleDB connection error: " + err);
        cb(null, binds, query);
      })
    },

    function(binds, query, cb) {
      log.group('tmp');
      //create tmp file to store csv file in
      tmp.file({
        keep: true,
        dir: __dirname + '/../tmp/'
      }, function(err, path, fd, cleanupCallback) {
        if (err) return cb("tmp error: " + err);
        log.log('Created tmp file ' + path.replace(/\\/g, '/'));
        //pass query (data), path, and tmp cleanupCallback function for later
        cb(null, binds, query, path, cleanupCallback);
      })
    },
    function(binds, query, path, cleanupCallback, cb) {
      //execute oracle row select
      log.group('oracle')
      log.log("Selecting data from OracleDB");
      var startTime = Date.now();
      dborac.execute(query, binds, {
        resultSet: true,
        prefetchRows: 10000
      }, function(err, results) {
        if (err) return cb("Oracle SELECT query error: " + err);
        var columnDefs = results.metaData;
        var rowsProcessed = 0;

        /* this works, but slowly - need to conver to csv package and file stream */

        function processResultSet() {
          //log.log('processResultSet() time: ' + ((Date.now() - startTime) / 1000));
          results.resultSet.getRows(500, function(err, rows) {
            if (err) return cb("Oracle resultSet.getRows() error: " + err);
            if (rowsProcessed == 0 && rows.length) {
              //define extras about columnDefs
              for (var i = 0; i < columnDefs.length; i++) {
                columnDefs[i].type = typeof(rows[0][i]);
              }
            }
            if (rows.length) {
              rowsProcessed += rows.length;
              stringify(rows, {
                delimiter: '\t',
                quoted: true,
                quotedEmpty: true
              }, function(err, csv) {
                if (err) return cb("json2csv error: " + err);
                fs.appendFile(path, csv, function(err) {
                  if (err) return cb("fs.writeFile error: " + err);
                  processResultSet(); //try to get more rows from the result set
                });
              });
              return;
            }

            log.log('Finish processing ' + rowsProcessed + ' rows');
            log.log('Total time (in seconds):' + ((Date.now() - startTime) / 1000));

            results.resultSet.close(function(err) {
              if (err) return cb('Closing resultSet error: ' + err);
              cb(null, path, cleanupCallback, columnDefs);

            });

          });
        };

        processResultSet();
      });
    },
    function(path, cleanupCallback, columnDefs, cb) {
      dborac.release(function(err) {
        if (err) return cb('Releasing dborac error: ' + err);
        cb(null, path, cleanupCallback, columnDefs);
      });
    },
    function(path, cleanupCallback, columnDefs, cb) {
      log.group('Table setup');
      mydb.query('DROP TABLE IF EXISTS ' + table, function(err) {
        if (err) return cb(err);
        cb(null, path, cleanupCallback, columnDefs);
      })
    },
    function(path, cleanupCallback, columnDefs, cb) {
      var columns = [],
        indexes = [];
      for (var i = 0; i < columnDefs.length; i++) {
        var name = columnDefs[i].name.replace(/\ /g, '');
        var noind = name.replace('_IND', '');
        var type = columnDefs[i].type == 'number' ? " INT " : " VARCHAR(255) ";
        if (name.indexOf('GPA') !== -1) type = " DECIMAL(4,2) ";
        columns.push(noind + type);
        if (name.indexOf('_IND') !== -1) indexes.push(' INDEX `' + noind + '` (`' + noind + '`) ');
      }
      var sql = 'CREATE TABLE ' + table + ' ( ' + columns.join(', ');
      if (indexes.length) {
        sql += ', ' + indexes.join(',') + ' )';
      } else {
        sql += ' )';
      }
      log.log(sql);
      mydb.query(sql, function(err) {
        if (err) return cb(err);
        cb(null, path, cleanupCallback);
      })
    },
    function(path, cleanupCallback, cb) {
      log.group('MySQL');
      log.log("Loading data in tmp file to MySQL.");
      var sql = "LOAD DATA INFILE '" + path.replace(/\\/g, '/') + "' INTO TABLE " + table + " FIELDS TERMINATED BY '\t' ENCLOSED BY '\"' LINES TERMINATED BY '\n'";
      mydb.query(sql, function(err, rows, fields) {
        if (err) return cb('LOAD DATE INFILE error: ' + err);
        cleanupCallback();
        cb(null);
      })
    },
    function(cb) {
      mydb.query('SELECT count(*) as rows FROM ' + table, function(err, result) {
        if (err) return cb('SELECT count(*) FROM ' + table + ' error: ' + err);
        cb(null, result[0].rows);
      })
    },
    function(rows, cb) {
      log.log("Successfully loaded " + rows + " rows into MySQL " + table);
      mydb.end(function(err) {
        // The connection is terminated now
        if (err) return cb('MySQL close error: ' + err);
        cb(null);
      });
    }
  ], function(err) {
    if (err) {
      log.error(err);
      try {
        mydb.end(function(err) {});
        dborac.release(function(err) {});
      } catch (e) {
        log.error(e);
      }
      callback(table + ' ' + err);
      return;
    }
    log.group('Finished').log(timer.now.str());
    callback(null, table);
  })


}
