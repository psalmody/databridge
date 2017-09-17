module.exports = (opt, columns, moduleCallback) => {

  const mysql = require('mysql')
  const readline = require('readline')
  const mySqlCreds = require(opt.cfg.dirs.creds + opt.destination)
  let db = mysql.createConnection(mySqlCreds)
  const async = require('async')
  let table = opt.source + '.' + opt.table.replace(/\./g, '_')
  let opfile = opt.opfile
  let log = opt.log

  let sqlTable = () => {
    let cols = []
    let ndxs = []
    columns.forEach((c) => {
      cols.push(' ' + c.name + ' ' + c.type + ' NULL')
      if (c.index) ndxs.push(' INDEX `' + c.name + '` (`' + c.name + '`) ')
    })
    let sql = 'CREATE TABLE ' + table + ' ( ' + cols.join(', ')
    if (ndxs.length) sql += ', ' + ndxs.join(',')
    sql += ' )'
    return sql
  }

  async.waterfall([
    //create database if not existing
    (cb) => {
      db.query('CREATE DATABASE IF NOT EXISTS ' + opt.source, (err) => {
        if (err) return cb(err)
        cb(null)
      })
    },
    //drop existing table
    (cb) => {
      if (opt.update || opt.truncate) return cb(null)
      db.query('DROP TABLE IF EXISTS ' + table, (err) => {
        if (err) return cb(err)
        cb(null)
      })
    },
    //create new table
    (cb) => {
      if (opt.update || opt.truncate) return cb(null) //don't drop table if update option
      let sql = sqlTable()
      db.query(sql, (err) => {
        if (err) return cb(err)
        cb(null)
      })
    },
    //truncate table if specified
    (cb) => {
      if (!opt.truncate) return cb(null)
      db.query('TRUNCATE TABLE ' + table, (e) => {
        //if error but it isn't table doesn't exist, throw error at cb
        if (e instanceof Error && e.toString().indexOf('doesn\'t exist') === -1) return cb('TRUNCATE TABLE error: ' + e)
          //if error but it's that the table doesn't exist, let's create it
        if (e instanceof Error && e.toString().indexOf('doesn\'t exist') !== -1) {
          db.query(sqlTable(), (e) => {
            if (e) return cb(e)
            cb(null)
          })
        } else {
          //otherwise, truncated smoothly
          cb(null)
        }
      })
    },
    //sql_mode to blank
    (cb) => {
      db.query('SET sql_mode = \'\'', (err) => {
        if (err) return cb('SET sql_mode error: ' + err)
        cb(null)
      })
    },
    //load data into table
    (cb) => {
      let sql = 'INSERT INTO ' + table + ' '
      let cs = []
      let first = true
      columns.forEach((c) => {
        cs.push(c.name)
      })
      sql += ' ( ' + cs.join(', ') + ' ) VALUES '
      let lineReader = readline.createInterface({
        input: opfile.readStream
      })
      lineReader.on('error', (err) => {
        return cb(err)
      })
      let insertLines = []
      lineReader.on('line', (line) => {
        if (first) {
          first = false
        } else {
          insertLines.push(' ( "' + line.split('\t').join('", "') + '")')
        }
      })
      lineReader.on('close', () => {
        sql += insertLines.join(',')
        cb(null, sql)
      })
    },
    (sql, cb) => {
      db.query(sql, (err) => {
        if (err) return cb('Insert data error: ' + err)
        cb(null)
      })
    },
    //check table rows
    (cb) => {
      db.query('SELECT count(*) as rows FROM ' + table, (err, result) => {
        if (err) return cb('SELECT COUNT(*) err: ' + err)
        cb(null, result[0].rows)
      })
    },
    (rows, cb) => {
      //check columns
      let table_name = table.split('.')[1]
      let sql = 'SELECT COLUMN_NAME as col FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=\'' + opt.source + '\' AND TABLE_NAME=\'' + table_name + '\''
      db.query(sql, (err, result) => {
        if (err) return cb('SELECT COLUMN_NAME err: ' + err)
        let cols = []
        result.forEach((row) => {
          cols.push(row.col)
        })
        cb(null, rows, cols)
      })
    }
  ], (err, rows, columns) => {
    db.end((err) => {
      if (err) moduleCallback(err)
    })
    if (err) {
      log.error(err)
      return moduleCallback(err)
    }
    moduleCallback(null, rows, columns)
  })
}
