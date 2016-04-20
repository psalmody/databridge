module.exports = function(opt, columns, moduleCallback) {

  var mssql = require('mssql'),
    creds = require(opt.cfg.dirs.creds + 'mssql'),
    async = require('async'),
    fs = require('fs'),
    log = opt.log,
    opfile = opt.opfile,
    timer = opt.timer;

  var db = opt.source,
    //use default dbo unless schema in filename
    table = opt.table.indexOf('.') > -1 ? opt.table : 'dbo.' + opt.table,
    schema = table.split('.')[0];

  function sqlTable() {
    var cols = [],
      ndxs = [];
    for (var i = 0; i < columns.length; i++) {
      cols.push(' ' + columns[i].name + ' ' + columns[i].type + ' ');
      if (columns[i].index) ndxs.push(' INDEX ' + columns[i].name + ' (' + columns[i].name + ') ');
    }
    var sql = 'CREATE TABLE ' + table + ' ( ' + cols.join(', ');
    if (ndxs.length) sql += ', ' + ndxs.join(',');
    sql += ' )';
    return sql;
  }

  ///var log = console;

  async.waterfall([
    //connect
    function(cb) {
      mssql.connect(creds).then(function() {
        log.group('mssql').log('connected to mssql');
        cb(null);
      }).catch(function(err) {
        cb(err);
      })
    },
    //create database if necessary
    function(cb) {
      new mssql.Request().query("if not exists(select * from sys.databases where name = '" + db + "') create database " + db).then(function(recordset) {
        log.log('created database (if not exists)');
        cb(null);
      }).catch(function(err) {
        cb(err);
      });
    },
    //create schema if necessary
    function(cb) {
      new mssql.Request().query("USE " + db + "; IF (SCHEMA_ID('" + schema + "') IS NULL ) BEGIN EXEC ('CREATE SCHEMA [" + schema + "] AUTHORIZATION [dbo]') END").then(function(recordset) {
        log.log('created schema ' + schema + ' (if not exists)');
        cb(null);
      }).catch(function(err) {
        cb(err);
      })
    },
    //drop table if exists
    function(cb) {
      if (opt.update) {
        log.log('Insert only - not dropping table.');
        return cb(null); //don't drop table if update option
      }
      var sql = "USE " + db + "; IF OBJECT_ID('" + table + "') IS NOT NULL DROP TABLE " + table;
      new mssql.Request().query(sql).then(function() {
        log.log('dropped table (if exists)');
        cb(null);
      }).catch(function(err) {
        cb(err);
      })
    },
    //create table
    function(cb) {
      if (opt.update) return cb(null); //don't drop table if update option
      log.group('Table setup').log('creating table');
      var sql = sqlTable();
      log.log(sql);
      new mssql.Request().query('USE ' + db + ';' + sql).then(function(recordset) {
        log.log('Created table');
        cb(null);
      }).catch(function(err) {
        cb(err);
      });
    },
    //insert data
    function(cb) {
      LineByLine = require('line-by-line'),
        rl = new LineByLine(opfile.filename);
      //every 100 lines of data, run insert query
      var thousand = [],
        first = true,
        rowsProcessed = 0,
        request = new mssql.Request();

      function insertLines(arr, callback) {
        //once empty, don't process
        if (!arr.length) return cb(0);
        //write query
        var sql = 'USE ' + db + '; INSERT INTO ' + table + ' VALUES ';
        //value array to use for this query
        var vals = [];
        for (var i = 0; i < arr.length; i++) {
          //escape any ' in the data
          var s = arr[i].replace(/'/g, "''").split('\t');
          //if missing columns, push null values

          while (s.length < columns.length) {
            s.push('null');
          }
          //join quoted string
          s = s.join("','");
          //encapsulate with quotes and parentheses
          s = " ('" + s + "') ";
          //replace any 'null' or '' with null
          s = s.replace(/'null'/g, 'null').replace(/''/g, 'null');
          //put data in array
          vals.push(s);
        }
        //join val statements
        sql += vals.join(',');
        //we'll return the rows processed
        rP = arr.length;
        arr.length = 0; //reset arr
        //insert rows - run query
        new mssql.Request().query(sql).then(function(recordset) {
          callback(rP);
        }).catch(function(err) {
          //if error, kill the entire script
          log.error('Error in insertLines(). This may be caused by extra commas in your data.');
          log.error(rowsProcessed);
          log.error(arr);
          log.error(err);
          process.exit();
        })
      }

      rl.on('line', function(line) {
        rl.pause();
        if (first) {
          first = false; //skip first line
          rl.resume();
        } else if (thousand.length < 999) {
          thousand.push(line); //if less than 999, push line to array and continue
          rl.resume();
        } else {
          thousand.push(line); //don't forget row 1000
          //if 1000 rows, run an insert
          insertLines(thousand, function(rows) {
            rowsProcessed += rows;
            thousand.length = 0;
            rl.resume();
          });
        }
      });
      rl.on('end', function() {
        //at end, insert any remaining lines in the thousand array
        insertLines(thousand, function(rows) {
          rowsProcessed += rows;
          log.group('Finish').log('Rows processed: ' + rowsProcessed);
          cb(null);
        })
      })
    },
    //check number of inserted rows
    function(cb) {
      new mssql.Request().query('USE ' + db + '; SELECT count(*) as rows FROM ' + table).then(function(recordset) {
        log.log('imported ' + recordset[0].rows)
        cb(null, recordset[0].rows);
      }).catch(function(err) {
        cb(err);
      })
    },
    function(rows, cb) {
      var sql = 'USE ' + db + '; SELECT COLUMN_NAME col FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \'' + table.split('.')[1] + '\' AND TABLE_SCHEMA = \'' + schema + '\'';
      new mssql.Request()
        .query(sql)
        .then(function(recordset) {
          var columns = [];
          recordset.forEach(function(row) {
            columns.push(row.col);
          })
          cb(null, rows, columns);
        }).catch(function(err) {
          cb(err);
        })

    }
  ], function(err, rows, columns) {
    try {
      mssql.close();
    } catch (e) {
      console.error(e);
    }
    if (err) return moduleCallback(err);
    log.group('Finished destination').log(timer.now.str());
    moduleCallback(null, rows, columns);
  })
}
