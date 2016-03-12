/**
 * Housing import from housing/*.csv
 */
module.exports = function(file, callback) {
  var fs = require('fs'),
    timer = require('./timer'),
    mysql = require('mysql'),
    mySqlCreds = require('../creds/mysql'),
    mydb = mysql.createConnection(mySqlCreds),
    async = require('async'),
    start = Date.now(),
    table = 'csv.' + file.replace('.csv', ''),
    log = require('./log')(table),
    INFILE = __dirname.replace(/\\/g, '/') + '/../csv/' + file;


  async.waterfall([
    function(cb) {
      fs.readFile(INFILE, 'utf-8', function(err, res) {
        if (err) return cb(err);
        var cols = res.split('\n')[0].split(',');
        var data = res.split('\n')[1].split(',');
        cb(null, cols, data);
      })
    },
    function(cols, data, cb) {
      mydb.query('DROP TABLE IF EXISTS ' + table, function(err) {
        if (err) return cb(err);
        cb(null, cols, data);
      })
    },
    function(cols, data, cb) {
      var sql = 'CREATE TABLE ' + table + ' ( ';
      var indexes = [],
        columns = [];
      for (var i = 0; i < cols.length; i++) {
        var col = cols[i].replace(/\ /g, '').replace('_IND', '').replace(/:/g, '');
        if (cols[i].indexOf('_IND') >= 0) indexes.push('`' + col + '` (`' + col + '`)');
        var type = typeof(data[i]) == 'number' ? (data[i].indexOf('GPA') !== -1 ? " INT " : " DECIMAL(4,2) ") : " VARCHAR(255) ";
        columns.push(' ' + col + ' ' + type + ' ');
      }
      sql += columns.join(', ');
      sql += indexes.length > 0 ? ', INDEX ' : '';
      sql += indexes.length > 0 ? indexes.join(', ') : '';
      sql += ")";
      log.log(sql);
      mydb.query(sql, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    function(cb) {
      log.log('Loading data in ./housing/housing.txt to MySQL.');
      var sql = "LOAD DATA INFILE '" + INFILE + "' INTO TABLE " + table + " FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' IGNORE 1 LINES";
      log.log(sql);
      mydb.query(sql, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    function(cb) {
      mydb.end(function(err) {
        if (err) return cb(err);
        cb(null);
      })
    }
  ], function(err) {
    if (err) {
      log.error(err);
      mydb.end(function(err) {});
      callback(err);
      return;
    }
    log.group('Finished').log(timer.now.str());
    callback(null, true);
  })

}
