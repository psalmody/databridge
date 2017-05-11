module.exports = (opt, columns, moduleCallback) =>  {

  const mssql = require('mssql')
  const readline = require('readline')
  const creds = require(opt.cfg.dirs.creds + opt.destination)
  const async = require('async')
  let log = opt.log
  let opfile = opt.opfile

  let db = opt.source
    //use default dbo unless schema in filenamenode_modules
  let table = opt.table.indexOf('.') > -1 ? opt.table : 'dbo.' + opt.table
  let schema = table.split('.')[0]

  function sqlTable() {
    let cols = []
    let ndxs = []
    columns.forEach((c) => {
      cols.push(` ${c.name} ${c.type} NULL `)
      if (c.index) ndxs.push(` INDEX ${c.name} ( ${c.name} ) `)
    })
    let sql = 'CREATE TABLE ' + table + ' ( ' + cols.join(', ')
    if (ndxs.length) sql += ', ' + ndxs.join(',')
    sql += ' )'
    return sql
  }

  async.waterfall([
    //connect
    (cb) =>  {
      mssql.connect(creds, (err) =>  {
        if (err) return cb('Connect error: ' + err)
        cb(null)
      })
    },
    //create database if necessary
    (cb) =>  {
      let s = `if not exists(select * from sys.databases where name = '${db}') create database ${db}`
      new mssql
        .Request()
        .query(s, (err) =>  {
          if (err) return cb(err)
          cb(null)
        })
    },
    //create schema if necessary
    (cb) =>  {
      let s = `USE ${db} IF (SCHEMA_ID('${schema}') IS NULL ) BEGIN EXEC ('CREATE SCHEMA [${schema}] AUTHORIZATION [dbo]') END`
      new mssql
        .Request()
        .query(s, (e) => {
          if (e) return cb(e)
          cb(null)
        })
    },
    //drop table if exists
    (cb) =>  {
      //don't drop table if update or truncate
      if (opt.update || opt.truncate) return cb(null)
      let sql = `USE ${db} IF OBJECT_ID('${table}') IS NOT NULL DROP TABLE ${table}`
      new mssql.Request().query(sql, (e) =>  {
        if (e) return cb('Drop table error: ' + e)
        cb(null)
      })
    },
    //create table
    (cb) =>  {
      //don't drop table if update or truncate
      if (opt.update || opt.truncate) return cb(null)
      new mssql.Request().query(`USE ${db} ` + sqlTable(), (e) => {
        if (e) return cb('Create table error: ' + e)
        cb(null)
      })
    },
    //truncate table if specified
    (cb) => {
      if (!opt.truncate) return cb(null)
      new mssql.Request().query('TRUNCATE TABLE ' + table, (e) => {
        if(e instanceof Error && e.toString().indexOf('because it does not exist') !== -1) {
          //if table doesn't exist, make it
          console.log('creating missing table')
          new mssql.Request().query(`USE ${db} ` + sqlTable(), (e) => {
            if (e) return cb('Create table that didnt exist to truncate error: ' + e)
            cb(null)
          })
        } else {
          if (e) return cb(e)
          cb(null)
        }
      })
    },
    //create insert statement
    (cb) =>  {
      let sql = `USE ${db} INSERT INTO ${table} `
      let cs = []
      let first = true
      columns.forEach((c) =>  {
        cs.push(c.name)
      })
      sql += ` ( ${cs.join(', ')} ) VALUES `
      let lineReader = readline.createInterface({
        input: opfile.createReadStream()
      })
      lineReader.on('error', (err) =>  {
        return cb('Readline error: ' + err)
      })
      let insertLines = []
      lineReader.on('line', (line) =>  {
        if (first) {
          first = false
        } else {
          let l = ' (\'' + line.replace(/\'/g, '').split('\t').join('\', \'') + '\') '
          l = l.replace(/\'\'/g, 'NULL').replace(/(\'[0-9]+\.[0-9]+\'|\'[0-9]\')/g, '$1')
          insertLines.push(l)
        }
      })
      lineReader.on('close', () =>  {
        cb(null, sql, insertLines)
      })
    },
    //insert lines
    (sql, lines, cb) =>  {
      let batchCount = Math.ceil(lines.length / 500)
      let arr = []
      for (let i = 0; i < batchCount; i++) {
        arr.push(i + 1)
      }
      async.map(arr, (i, callback) =>  {
        let stmt = sql + lines.slice(i * 500 - 500, i * 500).join(', ')
        new mssql.Request().query(stmt, (err) => {
          if (err) return callback('Insert values error: ' + err)
          callback(null)
        })
      }, (err) =>  {
        if (err) return cb(err)
        cb(null)
      })
    },
    //check number of inserted rows
    (cb) =>  {
      new mssql.Request().query(`USE ${db} SELECT count(*) as rows FROM ${table}`, (err, recordset) =>  {
        if (err) return cb('Check row number error: ' + err)
        cb(null, recordset[0].rows)
      })
    },
    (rows, cb) =>  {
      let sql = `USE ${db} SELECT COLUMN_NAME col FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table.split('.')[1]}' AND TABLE_SCHEMA = '${schema}'`
      new mssql.Request()
        .query(sql, (err, recordset) =>  {
          if (err) return cb(err)
          let columns = []
          recordset.forEach((row) =>  {
            columns.push(row.col)
          })
          cb(null, rows, columns)
        })
    }
  ], (err, rows, columns) =>  {
    try {
      mssql.close()
    } catch (e) {
      log.error(e)
    }
    if (err) return moduleCallback(err)
    moduleCallback(null, rows, columns)
  })
}
