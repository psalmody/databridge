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
    //insert data with BULK INSERT - way faster
    function(cb) {
      var sql = "USE " + db + "; BULK INSERT " + table + " FROM '" + opfile.filename + "' WITH ( FIELDTERMINATOR='\t', ROWTERMINATOR='\n', FIRSTROW=2)";
      new mssql.Request().query(sql).then(function() {
        log.log('BULK INSERT successful.');
        cb(null);
      }).catch(function(err) {
        cb(err);
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
    log.group('Finished destination').log(timer.str());
    moduleCallback(null, rows, columns);
  })
}
