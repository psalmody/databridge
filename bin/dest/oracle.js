module.exports = (opt, columns, moduleCallback) => {

  const creds = require(opt.cfg.dirs.creds + 'oracle')
  const oracledb = require('oracledb')
  const async = require('async')
  const readline = require('readline')
  const opfile = opt.opfile
  const table = opt.table
  const log = opt.log
  let resRows = []
  let oracle
  let inputGroups = []

  oracledb.autoCommit = true

  function sqlTable() {
    let cols = []
    for (var i = 0; i < columns.length; i++) {
      cols.push(' ' + columns[i].name + ' ' + columns[i].type + ' ')
    }
    return 'CREATE TABLE ' + table + ' ( ' + cols.join(', ') + ' )'
  }

  async.waterfall([
    //connect
    (cb) => {
      oracledb.getConnection(creds, (e, conn) => {
        if (e) return cb(e)
        oracle = conn
        cb(null)
      })
    },
    (cb) => {
      //drop table if not update
      if (opt.update) return cb(null)
      oracle.execute('DROP TABLE ' + table, [], (e) => {
        if (e instanceof Error && e.toString().indexOf('table or view does not exist') == -1) return cb('oracle drop table error: ' + e)
        cb(null)
      })
    },
    (cb) => {
      //create table
      if (opt.update) return cb(null)
      let sql = sqlTable()
      oracle.execute(sql, [], (e) => {
        if (e) return cb(e)
        cb(null)
      })
    },
    (cb) => {
      let cs = []
      let first = true
      columns.forEach((c) => {
        cs.push(c.name)
      })
      //create sql for each into line
      function lineSQL(l) {
        let s = ` INTO ${table} ( ${cs.join(', ')} ) VALUES ( '`
        s += l.split('\t').join('\', \'')
        s += `' ) `
        let lf = s.replace(/(\'[0-9]+\/[0-9]+\/[0-9]+\')/g, 'TO_DATE($1, \'MM/DD/YYYY\')')
        return lf
      }
      let lineRead = readline.createInterface({
        input: opfile.createReadStream()
      })
      lineRead.on('error', (e) => {
          cb(e)
        })
        .on('line', (l) => {
          //skip first row
          if (first === true) return first = false
          resRows.push(lineSQL(l))
        })
        .on('close', () => {
          cb(null)
        })
    },
    (cb) => {
      let i = 0
      async.whilst(() => {
        return i < resRows.length
      }, (callback) => {
        let j = i
        i = Math.min(resRows.length, i + 500)
        let rs = resRows.slice(j, i)
        let sql = 'INSERT ALL ' + rs.join(' ') + ' SELECT * FROM DUAL '
        //create async-type functions for parallelLimt
        let fn = (() => {
          return (callback) => {
            let s = j
            let e = i
            oracle.execute(sql, [], (err) => {
              if (err) return callback(`between ${s} and ${e}: ${err}`)
              callback(null)
            })
          }
        })(sql, i, j)
        const fs = require('fs')
        fs.writeFileSync('temp' + i + '.sql', sql)
        inputGroups.push(fn)
        callback(null, i)
      }, (e, n) => {
        if (e) return cb(e)
        cb(null)
      })
    },
    (cb) => {
      //run up to 3 at a time
      async.parallelLimit(inputGroups, 3, (e, r) => {
        if (e) return cb(e)
        cb(null)
      })
    },
    (cb) => {
      //indexes
      cb(null)
    },
    (cb) => {
      //check rows
      let sql = `SELECT COUNT(*) AS RS FROM ${table}`
      oracle.execute(sql, [], (e, r) => {
        if (e) return cb(e)
        cb(null, r.rows[0][0])
      })
    },
    (rows, cb) => {
      //check columns
      let schema = table.split('.')[0]
      let tableName = table.split('.')[1]
      let sql = `SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = `
      if (table.split('.').length > 1) {
        sql += `'${tableName}' AND OWNER = '${schema}'`
      } else {
        sql += `'${table}'`
      }
      oracle.execute(sql, [], (e, r) => {
        if (e) return cb(e)
        let c = []
        r.rows.forEach((v) => {
          c.push(v[0])
        })
        cb(null, rows, c)
      })
    }
  ], (err, rows, cols) => {
    //disconnect
    try {
      oracle.close((err) => {
        if (err) log.error(err)
      })
    } catch (e) {
      log.error(e)
    }
    if (err) return moduleCallback(err)
    moduleCallback(null, rows, cols)
  });
};
