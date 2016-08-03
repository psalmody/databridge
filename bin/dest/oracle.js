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
    }
    var sql = 'CREATE TABLE ' + table + ' ( ' + cols.join(', ') + ' )';
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
          var l = ' INTO ' + table + ' ( ' + cs.join(', ') + ' ) VALUES ( \'' + line.split('\t').join('\', \'') + '\' ) ';
          var lf = l.replace(/(\'[0-9]+\/[0-9]+\/[0-9]+\')/g, "TO_DATE($1, 'MM/DD/YYYY')");
          sql += lf;
        }
      });
      lineReader.on('close', function() {
        sql += ' SELECT * FROM dual ';
        cb(null, sql);
      });
    },
    //run query
    function(sql, cb) {
      require('fs').writeFileSync('temp.txt', sql);
      oracle.execute(sql, [], function(err, results) {
        if (err) return cb(err);
        cb(null);
      })
    },
    //indexes
    function(cb) {
      var ndx = [];
      columns.forEach(function(c) {
        if (c.index) ndx.push(c.name);
      });
      async.each(ndx, function(n, cb2) {
        var sql = 'CREATE INDEX ind_' + n + ' ON ' + table + '(' + n + ')';
        oracle.execute(sql, [], function(err, results) {
          if (err) return cb2(err);
          cb2(null);
        });
      }, function(err) {
        if (err) return cb(err);
        cb(null);
      });
    },
    //check number of inserted rows
    function(cb) {
      var sql = 'SELECT COUNT(*) AS RS FROM ' + table;
      oracle.execute(sql, [], function(err, results) {
        if (err) return cb(err);
        resRows = results.rows[0][0];
        cb(null);
      })
    },
    //check columns
    function(cb) {
      var schema = table.split('.')[0];
      var tableName = table.split('.')[1];
      var sql;
      if (table.split('.').length > 1) {
        sql = "SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = '" + tableName + "' AND OWNER = '" + schema + "'";
      } else {
        sql = "SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = '" + table + "'";
      };
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
    moduleCallback(null, resRows, resColumns);
  })
}
