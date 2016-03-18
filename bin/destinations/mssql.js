module.exports = function(args, opfile, columns, log, timer, callback) {

  var mssql = require('mssql'),
    creds = require('../../creds/mssql'),
    async = require('async');


  var db = args[2],
    table = args[2]+'.'+args[5];
  console.log(db);

  function sqlTable() {
    var cols = [],
      ndxs = [];
    for (var i = 0; i < columns.length; i++) {
      cols.push(' ' + columns[i].name + ' ' + columns[i].type + ' ');
      if (columns[i].index) ndxs.push(' INDEX ' + columns[i].name + ' (' + columns[i].name + ') ');
    }
    var sql = 'CREATE TABLE ' + args[5] + ' ( ' + cols.join(', ');
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
      new mssql.Request().query("IF OBJECT_ID('"+table+"', 'U') IS NOT NULL DROP TABLE "+table).then(function(recordset) {
        log.log('dropped table (if exists)');
        cb(null);
      }).catch(function(err) {
        cb(err);
      })
    },
    function(cb) {
      log.group('Table setup').log('creating table');
      var sql = sqlTable();
      log.log(sql);
      new mssql.Request().query('USE '+db+';'+sql).then(function(recordset) {
        log.log('Created table');
        cb(null);
      }).catch(function(err) {
        cb(err);
      });
    }
  ], function(err) {
    mssql.close();
    if (err) {
      return callback(err);
    }
    callback();
  })
}
