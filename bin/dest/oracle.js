module.exports = (opt, columns, moduleCallback) => {

  const creds = require(opt.cfg.dirs.creds + 'oracle')
  const oracledb = require('oracledb')
  const async = require('async')
  const readline = require('readline')
  const opfile = opt.opfile
  const table = opt.table
  const log = opt.log
  const tmp = require('tmp')
  const fs = require('fs')
  const child_process = require('child_process')
  const chrono = require('chrono-node')

  let oracle

  oracledb.autoCommit = true

  //sql table generates CREATE TABLE sql
  function sqlTable() {
    let cols = []
    for (var i = 0; i < columns.length; i++) {
      cols.push(' ' + columns[i].name + ' ' + columns[i].type + ' NULL')
    }
    let sql = 'CREATE TABLE ' + table + ' ( ' + cols.join(', ') + ' )'
    return sql
  }

  async.waterfall([
    //connect
    (cb) => {
      //connect with a pool
      oracledb.createPool(creds, (e, pool) => {
        if (e) return cb(e)
        oracle = pool
        cb(null)
      })
    },
    (cb) => {
      //drop table if not update
      if (opt.update) return cb(null)
      oracle.getConnection((e, conn) => {
        if (e) return cb(e)
        conn.execute('DROP TABLE ' + table, [], (e) => {
          if (e instanceof Error && e.toString().indexOf('table or view does not exist') == -1) return cb('oracle drop table error: ' + e);
          conn.close((e) => {
            if (e) return cb(e)
            cb(null)
          })
        })
      })
    },
    (cb) => {
      //create table if not update
      if (opt.update) return cb(null)
      let sql = sqlTable()
      oracle.getConnection((e, conn) => {
        if (e) return cb(e)
        conn.execute(sql, (e) => {
          if (e) return cb(e)
          conn.close((e) => {
            if (e) return cb(e)
            cb(null)
          })
        })
      })
    },
    (cb) => {
      //do the TO_DATE replace for dates and create new temp data file
      // output opfile to tmp file for slight changes for sqlldr
      let dataFile = tmp.fileSync()
      let lineReader = readline.createInterface({
        input: opfile.createReadStream()
      })
      let wStream = fs.createWriteStream(dataFile.name)
      let dateCols = []
      lineReader.on('error', (e) => {
        return cb(e)
      })
      lineReader.on('line', (line) => {
        let l = line.replace(/\t([0-9])(\/)/g, '\t0$1\/') //fix months in dates where missing beginning 0
          .replace(/(\/)([0-9])(\/)/g, '\/0$2\/') //fix day in dates where missing beginning 0
          .replace(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/g, '$3-$1-$2') //change data format
        let dates = chrono.parse(l)
        //parse dates and reformat based - include implied values
        dates.forEach((d) => {
          //console.log(d.start, typeof(d.start), typeof(d.start["ParsedComponents"]))
          let v = d.start.knownValues
          let i = d.start.impliedValues
          let a = {
            y: v.year || i.year,
            m: v.month || i.month,
            d: v.day || i.day,
            h: v.hour || i.hour,
            i: v.minute || i.minute,
            s: v.second || i.second
          }
          l.replace(d.text, `${a.y}-${a.m}-${a.d} ${a.h}:${a.i}:${a.s}\t`)
        })
        wStream.write(l + '\n')
      })
      lineReader.on('close', () => {
        wStream.end()
        cb(null, dataFile)
      })
    },
    (dataFile, cb) => {
      //run sqlldr
      let cs = []
      columns.forEach((c) => {
          let n = c.name.indexOf('DATE') !== -1 || c.name.indexOf('TIMESTAMP') !== -1 ? `${c.name} DATE 'YYYY-MM-DD'` : c.name
          cs.push(n)
        })
        //connect string
      let connect = creds.connectString
        //control file
      let ctl = `
      OPTIONS (SKIP=1)
      load data
      infile '${dataFile.name}'
      into table ${table}
      fields terminated by "\t"
      TRAILING NULLCOLS
      (${cs.join(', ')})
      `
        //create temp control file
      let ctlFile = tmp.fileSync()
      fs.writeFileSync(ctlFile.name, ctl)
      let logFile = tmp.fileSync()
        //let command = `sqlldr '${creds.user}/${creds.password}@${connect}' control=${ctlFile.name} log=${logFile.name}`
        //execute sqlldr
      let child = child_process.spawn('sqlldr', [`'${creds.user}/${creds.password}@${connect}'`, `control=${ctlFile.name}`, `log=${logFile.name}`])
      child.stdout.on('data', () => {
        //sqlldr spits out a bunch of info here - but it's too much for the log file
        // we'll just check row totals at the end
      })
      child.stderr.on('data', (d) => {
        log.log('stderr: ', d.toString())
      })
      child.on('close', (c) => {
        if (c !== 0) {
          console.log(fs.readFileSync(logFile.name,'utf8'))
          return cb('child process exited with code ' + c)
        }
        cb(null)
      })
    },
    (cb) => {
      //create indexes
      let ndx = []
      columns.forEach((c) => {
        if (!c.index) return true
        ndx.push(c.name)
      })
      if (ndx.length === 0) return cb(null)
      let count = 0
      let t = table.indexOf('.') === -1 ? table : table.split('.')[1]
      ndx.forEach((c) => {
        oracle.getConnection((e, conn) => {
          if (e) return cb(e)
          let x = `ind_${t}_${c}`.substring(0, 25)
          conn.execute(`CREATE INDEX ${x} ON ${table} (${c})`, (e) => {
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
        sql += `'${tableName.toUpperCase()}' AND OWNER = '${schema.toUpperCase()}'`
      } else {
        sql += `'${table.toUpperCase()}'`
      }
      //order by order in the database
      sql += ' ORDER BY COLUMN_ID '
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
