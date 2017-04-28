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
  const child_process = require('child_process')

  let resRows = []
  let oracle
  let inputGroups = []

  oracledb.autoCommit = true

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
      let lineCounter = 0;
      fs.writeFileSync('temp.tsv','')
      lineReader.on('error', (e) => {
        return cb(e)
      })
      lineReader.on('line', (line) => {
        let l = line.replace(/\t([0-9])(\/)/g,'\t0$1\/') //fix months in dates where missing beginning 0
          .replace(/(\/)([0-9])(\/)/g,'\/0$2\/') //fix day in dates where missing beginning 0
          .replace(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/g, '$3-$1-$2') //change data format
        lineCounter++
        fs.appendFileSync(dataFile.name, l + '\t\n')
        if(lineCounter < 20) fs.appendFileSync('temp.tsv',l+'\t\n')
      })
      lineReader.on('close', () => {
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
      (${cs.join(', ')})
      `
      //create temp control file
      let ctlFile = tmp.fileSync()
      fs.writeFileSync(ctlFile.name, ctl)
      let logFile = tmp.fileSync()
      let command = `sqlldr '${creds.user}/${creds.password}@${connect}' control=${ctlFile.name} log=temp.log`//${logFile.name}`
      //execute sqlldr
      child_process.exec(command, (err, stdout, stderr) => {
        if (err) return cb(err)
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
      let count = 0
      let t = table.indexOf('.') === -1 ? table : table.split('.')[1]
      ndx.forEach((c) => {
        oracle.getConnection((e, conn) => {
          if (e) return cb(e)
          let x = `ind_${t}_${c}`.substring(0,25)
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
