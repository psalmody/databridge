module.exports = function(opt, columns, moduleCallback) {

  var mysql = require('mysql'),
    readline = require('readline'),
    mySqlCreds = require(opt.cfg.dirs.creds + 'mysql'),
    db = mysql.createConnection(mySqlCreds),
    async = require('async'),
    table = opt.source + '.' + opt.table.replace(/\./g, '_'),
    opfile = opt.opfile,
    log = opt.log;

  function sqlTable() {
    var cols = [],
      ndxs = [];
    for (var i = 0; i < columns.length; i++) {
      cols.push(' ' + columns[i].name + ' ' + columns[i].type + ' ');
      if (columns[i].index) ndxs.push(' INDEX `' + columns[i].name + '` (`' + columns[i].name + '`) ');
    }
    var sql = 'CREATE TABLE ' + table + ' ( ' + cols.join(', ');
    if (ndxs.length) sql += ', ' + ndxs.join(',');
    sql += ' )';
    return sql;
  }

  async.waterfall([
    //create database if not existing
    function(cb) {
      db.query('CREATE DATABASE IF NOT EXISTS ' + opt.source, function(err) {
        if (err) return cb(err);
        cb(null);
      });
    },
    //drop existing table
    function(cb) {
      if (opt.update) {
        return cb(null); //don't drop table if update option
      }
      db.query('DROP TABLE IF EXISTS ' + table, function(err) {
        if (err) return cb(err);
        cb(null);
      });
    },
    //create new table
    function(cb) {
      if (opt.update) return cb(null); //don't drop table if update option
      var sql = sqlTable();
      db.query(sql, function(err) {
        if (err) return cb(err);
        cb(null);
      });
    },
    //sql_mode to blank
    function(cb) {
      db.query('SET sql_mode = \'\'', function(err) {
        if (err) return cb('SET sql_mode error: ' + err);
        cb(null);
      });
    },
    //load data into table
    function(cb) {
      var sql = 'INSERT INTO ' + table + ' ';
      var cs = [];
      var first = true;
      columns.forEach(function(c) {
        cs.push(c.name);
      });
      sql += ' ( ' + cs.join(', ') + ' ) VALUES ';
      var lineReader = readline.createInterface({
        input: opfile.createReadStream()
      });
      lineReader.on('error', function(err) {
        return cb(err);
      });
      var insertLines = [];
      lineReader.on('line', function(line) {
        if (first) {
          first = false;
        } else {
          insertLines.push(' ( "' + line.split('\t').join('", "') + '")');
        }
      });
      lineReader.on('close', function() {
        sql += insertLines.join(',');
        cb(null, sql);
      });
    },
    function(sql, cb) {
      db.query(sql, function(err) {
        if (err) return cb('Insert data error: ' + err);
        cb(null);
      });
    },
    //check table rows
    function(cb) {
      db.query('SELECT count(*) as rows FROM ' + table, function(err, result) {
        if (err) return cb('SELECT COUNT(*) err: ' + err);
        cb(null, result[0].rows);
      });
    },
    function(rows, cb) {
      //check columns
      var table_name = table.split('.')[1];
      var sql = 'SELECT COLUMN_NAME as col FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=\'' + opt.source + '\' AND TABLE_NAME=\'' + table_name + '\'';
      db.query(sql, function(err, result) {
        if (err) return cb('SELECT COLUMN_NAME err: ' + err);
        var cols = [];
        result.forEach(function(row) {
          cols.push(row.col);
        });
        cb(null, rows, cols);
      });
    }
  ], function(err, rows, columns) {
    db.end(function(err) {
      if (err) moduleCallback(err);
    });
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    moduleCallback(null, rows, columns);
  });
};
