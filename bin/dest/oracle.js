Object.defineProperty(global, '__stack', {
  get: function() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack) {
      return stack;
    };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, '__line', {
  get: function() {
    return 'line: ' + __stack[1].getLineNumber();
  }
});

module.exports = (opt, columns, moduleCallback) => {

  if (opt.spinner) opt.spinner.stop()

  const creds = require(opt.cfg.dirs.creds + 'oracle')
  const oracledb = require('oracledb')
  const async = require('async')
  const readline = require('readline')
  const opfile = opt.opfile
  const table = opt.table
  const log = opt.log
  const tmp = require('tmp')
  const fs = require('fs')
  const winston = require('winston')

  let logger = new (winston.Logger) ({
    transports: [
      new (winston.transports.Console) ({
        timestamp: () => {
          let d = new Date()
          return `[${("0"+d.getHours()).slice(-2)}:${("0"+d.getMinutes()).slice(-2)}:${("0"+d.getSeconds()).slice(-2)}.${("000"+d.getMilliseconds()).slice(-3)}]`
        },
        formatter: (options) => {
          return options.timestamp() +' '+ options.level.toUpperCase() +': '+ (options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' )
        }
      })
    ]
  })

  let resRows = []
  let oracle
  let inputGroups = []
  //let numInsertQueries = 0

  oracledb.autoCommit = true
  oracledb.queueTimeout = 1
  oracledb.poolMax = 25
  oracledb.poolMin = 24
  oracledb.poolTimeout = 1

  //increase thread size for oracle
  process.env.UV_THREADPOOL_SIZE = 100

  //sql table generates CREATE TABLE sql
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
      logger.info(__line)
      //oracledb.getConnection(creds, (e, conn) => {
      oracledb.createPool(creds, (e, pool) => {
        if (e) return cb(e)
        oracle = pool
        cb(null)
      })
    },
    (cb) => {
      logger.info(__line)
      //drop table if not update
      if (opt.update) return cb(null)
      let sql = sqlTable()
      oracle.getConnection((e, conn) => {
        if (e) return cb(e)
        conn.execute('DROP TABLE ' + table, [], (e) => {
          if (e instanceof Error && e.toString().indexOf('table or view does not exist') == -1) return cb('oracle drop table error: ' + err);
          conn.close((e) => {
            if (e) return cb(e)
            cb(null)
          })
        })
      })
    },
    (cb) => {
      logger.info(__line)
      //create table
      if (opt.update) return cb(null)
      let sql = sqlTable()
      oracle.getConnection((e, conn) => {
        logger.info(__line, e)
        if (e) return cb(e)
        conn.execute(sql, (e) => {
          fs.writeFileSync('messedup.sql', sql)
          logger.info(__line, e, sql)
          if (e) return cb(e)
          conn.close((e) => {
            logger.info(__line, e)
            if (e) return cb(e)
            cb(null)
          })
        })
      })
    },
    (cb) => {
      logger.info(__line)
      let cs = []
      let first = true
      columns.forEach((c) => {
        cs.push(c.name)
      })
      //create sql for each into line
      let sqlStart = `INTO ${table} (${cs.join(',')}) VALUES ('`
      function lineSQL(l) {
        let s = sqlStart
        let cells = (l.match(/\t/g) || []).length + 1
        let append = cs.length - cells
        //escape single quotes, replace tabs with ', ' and fix any dates without leading zero (01 instead of 1)
        s += l.replace(/\'/g,'\'\'') //escape '
          .replace(/\t/g, '\', \'') //tabs to ', '
          .replace(/(\')([0-9])(\/)/g,'\'0$2\/') //fix months in dates where missing beginning 0
          .replace(/(\/)([0-9])(\/)/g,'\/0$2\/') //fix day in dates where missing beginning 0
          .replace(/\'([0-9]{2})\/([0-9]{2})\/([0-9]{4})\'/g, 'TO_DATE(\'$3-$1-$2\',\'YYYY-MM-DD\')') //add TO_DATE for dates
        for (let i = 0; i < append; i++ ) {
          s+= "','"
        }
        s += `')`
        return s
      }
      //line reader stream
      let lineRead = readline.createInterface({
        input: opfile.createReadStream()
      })
      lineRead.on('error', (e) => {
          cb(e)
        })
        .on('line', (l) => {
          //skip first row
          if (first === true) return first = false
          if (l === '') return false
          //push each non-empty line into resRows as a semi-SQL statement
          resRows.push(lineSQL(l))
        })
        .on('close', () => {
          cb(null, cs)
        })
    },
    (cs, cb) => {
      logger.info(__line)
      // create a tmp file and dump the sql for 1000 rows at a time
      // then create a async-style function to pass to inputGroups
      // which will read the tmp-sql file and execute that query
      // splice is used since slice causes a memory issue
      let rows = resRows.length
      let i = 0
      logger.info(__line, Math.ceil(resRows.length/1000))
      //numInsertQueries = Math.ceil(resRows.length/1000)
      async.times(Math.ceil(resRows.length/1000), (n, next) => {
        let r = resRows.splice(0, 1000)
        let left = resRows.length
        logger.info(__line, r.length, resRows.length)
        if (!r.length) {
          //numInsertQueries--;
          return next(null)
        }
        let tmpobj
        try { tmpobj = tmp.fileSync() } catch(e) { next(e) }
        let name = tmpobj.name
        try { fs.writeFileSync(name, `INSERT ALL ${r.join(' ')} SELECT 1 FROM DUAL`) } catch(e) { next(e) }
        let fn = (() => {
          return (callback) => {
            oracle.getConnection((e, conn) => {
              //logger.info(__line, resRows.length)
              if (e) return callback(e)
              logger.info('start query read')
              let s = fs.readFileSync(name, 'utf8')
              logger.info('end query read')
              conn.execute(s, [], (err) => {
                if (err) fs.writeFileSync('temp.broken.sql', fs.readFileSync(name, 'utf8'), 'utf8')
                if (err) return callback(`with ${left} rows left: ${err}`)
                logger.info('left: ', left)
                conn.close((e) => {
                  if (e) return callback(e)
                  //numInsertQueries--;
                  //callback(null)
                })
                callback(null)
              })
            })
          }
        })(name, left)
        inputGroups.push(fn)
        i += 1
        //logger.info(__line, i, resRows.length)
        next(null)
      }, (e) => {
        logger.info(__line, inputGroups.length)
        //numInsertQueries = inputGroups.length
        cb(null)
      })
    },
    (cb) => {
      logger.info(__line)
      //run queries in parallel - oracledb connection pool
      // is limiting to 4 connections at a time
      //async.parallelLimit(inputGroups, 3, (e, r) => {
      async.parallel(inputGroups, (e, r) => {
        logger.info('async.parallel',__line,e)
        //logger.info(oracle.connectionsInUse)
        if (e) return cb(e)
        /*async.whilst(()=> {
          logger.info(__line, numInsertQueries)
          return numInsertQueries > 0
        }, (callback) => {
          logger.info(__line, numInsertQueries)
          callback()
        }, (e) => {
          if (e) return cb(e)
          cb(null)
        })*/
        cb(null)
      })
    },
    (cb) => {
      logger.info(__line)
      let ndx = []
      columns.forEach((c) => {
        if (!c.index) return true
        ndx.push(c.name)
      })
      let count = 0
      let t = table.indexOf('.') === -1 ? table : table.split('.')[1]
      ndx.forEach((c) => {
        oracle.getConnection((e, conn) => {
          if (e) return cb(e)
          let x = `ind_${t}_${c}`.substring(0,25)
          logger.info(__line, table, x)
          conn.execute(`CREATE INDEX ${x} ON ${table} (${c})`, (e, r) => {
            if (e) return cb(e)
            conn.close((e) => {
              if (e) return cb(e)
            })
            count++
            if (count === ndx.length) cb(null)
          })
        })
      })
    },
    (cb) => {
      logger.info(__line)
      //check rows
      let sql = `SELECT COUNT(*) AS RS FROM ${table}`
      oracle.getConnection((e, conn) => {
        if (e) return cb(e)
        conn.execute(sql, [], (e, r) => {
          if (e) return cb(e)
          conn.close((e) => {
            if (e) return cb(e)
            cb(null, r.rows[0][0])
          })
        })
      })
    },
    (rows, cb) => {
      //check columns
      let schema = table.split('.')[0]
      let tableName = table.split('.')[1]
      let sql = 'SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = '
      if (table.split('.').length > 1) {
        sql += `'${tableName}' AND OWNER = '${schema}'`
      } else {
        sql += `'${table}'`
      }
      oracle.getConnection((e, conn) => {
        conn.execute(sql, [], (e, r) => {
          if (e) return cb(e)
          let c = []
          r.rows.forEach((v) => {
            c.push(v[0])
          })
          conn.close((e) => {
            if (e) return cb(e)
            cb(null, rows, c)
          })
        })
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
