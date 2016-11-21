module.exports = function(opt, columns, moduleCallback) {

  var mssql = require('mssql'),
    readline = require('readline'),
    creds = require(opt.cfg.dirs.creds + 'mssql'),
    async = require('async'),
    log = opt.log,
    opfile = opt.opfile;

  var db = opt.source,
    //use default dbo unless schema in filenamenode_modules
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

  async.waterfall([
    //connect
    function(cb) {
      mssql.connect(creds).then(function() {
        cb(null);
      }).catch(function(err) {
        cb('Connect error: ' + err);
      });
    },
    //create database if necessary
    function(cb) {
      new mssql
        .Request()
        .query('if not exists(select * from sys.databases where name = \'' + db + '\') create database ' + db)
        .then(function() {
          cb(null);
        }).catch(function(err) {
          cb('Create db error: ' + err);
        });
    },
    //create schema if necessary
    function(cb) {
      new mssql
        .Request()
        .query('USE ' + db + '; IF (SCHEMA_ID(\'' + schema + '\') IS NULL ) BEGIN EXEC (\'CREATE SCHEMA [' + schema + '] AUTHORIZATION [dbo]\') END')
        .then(function() {
          cb(null);
        }).catch(function(err) {
          cb('Create schema error: ' + err);
        });
    },
    //drop table if exists
    function(cb) {
      if (opt.update) {
        return cb(null); //don't drop table if update option
      }
      var sql = 'USE ' + db + '; IF OBJECT_ID(\'' + table + '\') IS NOT NULL DROP TABLE ' + table;
      new mssql.Request().query(sql).then(function() {
        cb(null);
      }).catch(function(err) {
        cb('Drop table error: ' + err);
      });
    },
    //create table
    function(cb) {
      if (opt.update) return cb(null); //don't drop table if update option
      var sql = sqlTable();
      new mssql.Request().query('USE ' + db + ';' + sql).then(function() {
        cb(null);
      }).catch(function(err) {
        cb('Create table error: ' + err);
      });
    },
    //create insert statement
    function(cb) {
      var sql = 'USE ' + db + '; INSERT INTO ' + table + ' ';
      var cs = [];
      var first = true;
      var counter = 0;
      columns.forEach(function(c) {
        cs.push(c.name);
      });
      sql += ' ( ' + cs.join(', ') + ' ) VALUES ';
      var lineReader = readline.createInterface({
        input: opfile.createReadStream()
      });
      lineReader.on('error', function(err) {
        return cb('Readline error: ' + err);
      });
      var insertLines = [];
      lineReader.on('line', function(line) {
        if (first) {
          first = false;
        } else {
          var l = ' (\'' + line.replace(/\'/g,'').split('\t').join('\', \'') + '\') ';
          l = l.replace(/\'\'/g, 'NULL').replace(/(\'[0-9]+\.[0-9]+\'|\'[0-9]\')/g, '$1');
          insertLines.push(l);
        }
      });
      lineReader.on('close', function() {
        cb(null, sql, insertLines);
      });
    },
    //insert lines
    function(sql, lines, cb) {
      var batchCount = Math.ceil(lines.length/500);
      var arr = [];
      for(var i=0; i<batchCount; i++) {
        arr.push(i+1);
      }
      async.map(arr, function(i, callback) {
        var stmt = sql + lines.slice(i*500-500,i*500).join(', ');
        new mssql.Request().query(stmt).then(function() {
          callback(null);
        }).catch(function(err) {
          callback('Insert values error: ' + err);
        });
      }, function(err) {
        if (err) return cb(err);
        cb(null);
      });
    },
    //check number of inserted rows
    function(cb) {
      new mssql.Request().query('USE ' + db + '; SELECT count(*) as rows FROM ' + table).then(function(recordset) {
        cb(null, recordset[0].rows);
      }).catch(function(err) {
        cb('Check row number error: ' + err);
      });
    },
    function(rows, cb) {
      var sql = 'USE ' + db + '; SELECT COLUMN_NAME col FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \'' + table.split('.')[1] + '\' AND TABLE_SCHEMA = \'' + schema + '\'';
      new mssql.Request()
        .query(sql)
        .then(function(recordset) {
          var columns = [];
          recordset.forEach(function(row) {
            columns.push(row.col);
          });
          cb(null, rows, columns);
        }).catch(function(err) {
          cb(err);
        });

    }
  ], function(err, rows, columns) {
    try {
      mssql.close();
    } catch (e) {
      log.error(e);
    }
    if (err) return moduleCallback(err);
    moduleCallback(null, rows, columns);
  });
};
