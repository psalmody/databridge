module.exports = function(opt, columns, moduleCallback) {

  var mysql = require('mysql'),
    mySqlCreds = require(opt.cfg.dirs.creds + 'mysql'),
    db = mysql.createConnection(mySqlCreds),
    async = require('async'),
    table = opt.source + '.' + opt.table.replace(/\./g, '_'),
    opfile = opt.opfile,
    log = opt.log,
    timer = opt.timer;

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
        log.log('Insert only - not dropping table.');
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
      log.group('Table setup').log('Dropped table, setting new.');
      var sql = sqlTable();
      log.log(sql);
      db.query(sql, function(err) {
        if (err) return cb(err);
        cb(null);
      });
    },
    //load data into table
    function(cb) {
      log.log('Loading data in opfile to MySQL');
      var sql = 'LOAD DATA INFILE \'' + opfile.filename + '\' INTO TABLE ' + table + ' FIELDS TERMINATED BY \'\t\' ENCLOSED BY \'"\' LINES TERMINATED BY \'\n\' IGNORE 1 LINES ';
      db.query(sql, function(err) {
        if (err) return cb('Load data infile error: ' + err);
        cb(null);
      });
    },
    //check table rows
    function(cb) {
      db.query('SELECT count(*) as rows FROM ' + table, function(err, result) {
        if (err) return cb('SELECT COUNT(*) err: ' + err);
        log.log('Successfully loaded ' + result[0].rows + ' rows into MySQL.');
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
    log.group('Finished destination').log(timer.str());
    moduleCallback(null, rows, columns);
  });
};
