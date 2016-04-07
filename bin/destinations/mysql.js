module.exports = function(options, opfile, columns, log, timer, moduleCallback) {

  var mysql = require('mysql'),
    mySqlCreds = require('../../creds/mysql'),
    db = mysql.createConnection(mySqlCreds),
    async = require('async'),
    table = options.source + '.' + options.table;

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
      db.query('CREATE DATABASE IF NOT EXISTS ' + options.source, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    //drop existing table
    function(cb) {
      db.query('DROP TABLE IF EXISTS ' + table, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    //create new table
    function(cb) {
      log.group('Table setup').log('Dropped table, setting new.');
      var sql = sqlTable();
      log.log(sql);
      db.query(sql, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    //load data into table
    function(cb) {
      log.log('Loading data in opfile to MySQL');
      var sql = "LOAD DATA INFILE '" + opfile.filename + "' INTO TABLE " + table + " FIELDS TERMINATED BY '\t' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 LINES ";
      db.query(sql, function(err) {
        if (err) return cb('Load data infile error: ' + err);
        cb(null);
      })
    },
    //check table rows
    function(cb) {
      db.query('SELECT count(*) as rows FROM ' + table, function(err, result) {
        if (err) return cb('SELECT COUNT(*) err: ' + err);
        log.log('Successfully loaded ' + result[0].rows + ' rows into MySQL.');
        cb(null);
      })
    }
  ], function(err) {
    try {
      db.end(function(err) {
        if (err) console.error(err);
      })
    } catch (e) {

    }
    if (err) {
      log.error(err);
      return moduleCallback(err);
    }
    log.group('Finished destination').log(timer.now.str());
    moduleCallback(null, opfile);
  })
};
