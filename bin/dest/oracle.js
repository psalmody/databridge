module.exports = function(opt, columns, moduleCallback) {

  var creds = require(opt.cfg.dirs.creds + 'oracle'),
    oracledb = require('oracledb'),
    async = require('async'),
    readline = require('readline'),
    opfile = opt.opfile,
    table = opt.table,
    log = opt.log,
    timer = opt.timer,
    resRows,
    resColumns = [],
    oracle;

  oracledb.autoCommit = true;

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
  };

  async.waterfall([
    //connect
    function(cb) {
      oracledb.getConnection(creds, function(err, conn) {
        if (err) return cb(err);
        oracle = conn;
        cb(null);
      })
    },
    //drop table if exists
    function(cb) {
      if (opt.update) {
        log.log('Insert only - not dropping table.');
        return cb(null);
      }
      oracle.execute('DROP TABLE ' + table, [], function(err, results) {
        //we expect an error if this is a new table
        if (err instanceof Error && err.toString().indexOf('table or view does not exist') == -1) return cb('oracle drop table error: ' + err);
        cb(null);
      });
    },
    //create table
    function(cb) {
      if (opt.update) return cb(null); //don't drop table if update
      var sql = sqlTable();
      console.log(sql);
      oracle.execute(sql, [], function(err, results) {
        if (err) return cb(err);
        cb(null);
      });
    },
    //format query data
    function(cb) {
      var sql = 'INSERT ALL ';
      var cs = [];
      var first = true;
      columns.forEach(function(c) {
        cs.push(c.name);
      });
      var lineReader = readline.createInterface({
        input: opfile.createReadStream()
      });
      lineReader.on('error', function(err) {
        return cb(err);
      });
      lineReader.on('line', function(line) {
        if (first) {
          first = false;
        } else {
          sql += ' INTO ' + table + ' ( ' + cs.join(', ') + ' ) VALUES ( \'' + line.split('\t').join('\', \'') + '\' ) ';
        }
      });
      lineReader.on('close', function() {
        sql += ' SELECT * FROM dual ';
        cb(null, sql);
      });
    },
    //run query
    function(sql, cb) {
      oracle.execute(sql, [], function(err, results) {
        if (err) return cb(err);
        cb(null);
      })
    },
    //check number of inserted rows
    function(cb) {
      var sql = 'SELECT COUNT(*) AS RS FROM ' + table;
      oracle.execute(sql, [], function(err, results) {
        if (err) return cb(err);
        rows = results.rows[0][0];
        cb(null);
      })
    },
    //check columns
    function(cb) {
      var schema = table.split('.')[0];
      var tableName = table.split('.')[1];
      var sql = "SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = '" + tableName + "' AND OWNER = '" + schema + "'";
      oracle.execute(sql, [], function(err, results) {
        if (err) return cb(err);
        results.rows.forEach(function(v) {
          resColumns.push(v);
        });
        cb(null);
      })
    }
  ], function(err) {
    //disconnect
    try {
      oracle.close(function(err) {
        if (err) log.error(err);
        return;
      })
    } catch (e) {
      log.error(e);
    }
    if (err) return moduleCallback(err);
    log.group('Finished destiantion').log(timer.str());
    moduleCallback(null, resRows, resColumns);
  })
}
