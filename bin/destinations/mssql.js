module.exports = function(args, opfile, columns, log, timer, moduleCallback) {

  var mssql = require('mssql'),
    creds = require('../../creds/mssql'),
    async = require('async'),
    readline = require('readline'),
    fs = require('fs');


  var db = args[2],
    table = args[3];

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
    //drop table if exists
    function(cb) {
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
    // bulk insert
    /*function(cb) {
      new mssql.Request().query("BULK INSERT " + table + " FROM '" + opfile.filename + "' WITH (FIELDTERMINATOR='\t',ROWTERMINATOR='\n',FIRSTROW=2)").then(function(recordset) {
        cb(null);
      }).catch(function(err) {
        cb(err);
      })
    },*/
    function(cb) {
      LineByLine = require('line-by-line'),
        rl = new LineByLine(opfile.filename);
      //every 100 lines, run query
      var hundred = [],
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
          log.error('Error in insertLines()');
          log.error(request);
          log.error(rowsProcessed);
          log.error(arr);
          log.error(err);
          console.log(request, rowsProcessed, "Error in  insertLines()", arr, err);
          process.exit();
        })
      }

      rl.on('line', function(line) {
        rl.pause();
        if (first) {
          first = false; //skip first line
          rl.resume();
        } else if (hundred.length < 99) {
          hundred.push(line); //if less than 99, push line to array and continue
          rl.resume();
        } else {
          hundred.push(line); //don't forget row 100
          //if 10 rows, run an insert
          insertLines(hundred, function(rows) {
            rowsProcessed += rows;
            hundred.length = 0;
            rl.resume();
          });
        }
      });
      rl.on('end', function() {
        insertLines(hundred, function(rows) {
          rowsProcessed += rows;
          log.log('Rows processed: ' + rowsProcessed);
          cb(null);
        })
      })
    },
    //check table rows
    function(cb) {
      new mssql.Request().query('SELECT count(*) as rows FROM ' + table).then(function(recordset) {
        log.log('imported ' + recordset[0].rows)
        cb(null);
      }).catch(function(err) {
        cb(err);
      })
    }
  ], function(err) {
    mssql.close();
    if (err) {
      return moduleCallback(err);
    }
    moduleCallback(null, opfile);
  })
}
