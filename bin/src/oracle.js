module.exports = (opt, moduleCallback) => {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source)

  const creds = require(opt.cfg.dirs.creds + 'oracle')
  const oracledb = require('oracledb')
  const async = require('async')
  const fs = require('fs')
  const table = opt.table
  const log = opt.log
  const bindQuery = require(opt.bin + 'bind-query')
  const opfile = opt.opfile
  const moment = require('moment')

  let oracle

  async.waterfall([
      //connect
      (cb) => {
        oracledb.getConnection(creds, (e, c) => {
          if (e) return cb(e)
          oracle = c
          cb(null)
        })
      },
      //read query
      (cb) => {
        fs.readFile(`${opt.cfg.dirs.input}//${opt.source}/${table}.sql`, 'utf8', (e, data) => {
          if (e) return cb('fs readFile error')
          cb(null, data)
        })
      },
      //bind variables
      (data, cb) => {
        bindQuery(data, opt, (e, sql) => {
          if (e) return cb(e)
          cb(null, sql)
        })
      },
      //execute
      (sql, cb) => {
        let counter = 0
        let stream = oracle.queryStream(sql, [], {
          resultSet: true,
          prefetchRows: 10000
        })
        let columns = []
          //hold data temporarily in array until columns are written
          // TODO move this temporary hold to opfile module and handle all sources this way
        let tempHold = []
        let flag = false
          // on rows either put in temporary data or append to file
          // if columns are already in
        stream.on('data', (d) => {
            counter++
            let row = d.map((c) => {
              if (c instanceof Date) return moment(c).format('YYYY-MM-DD HH:mm:ss Z')
              return c
            })
            if (flag === false) {
              //columns not written yet
              tempHold.push(row.join('\t') + '\n')
            } else {
              //columns written, dump tempHold and start appending data
              let t = tempHold.join('')
              tempHold = []
              opfile.append(t + row.join('\t') + '\n', (e) => {
                if (e) return cb(e)
              })
            }
          })
          .on('error', (e) => {
            cb(e)
          })
          .on('end', () => {
            //may need to dump tempHold data
            if (tempHold.length > 0) {
              opfile.append(tempHold.join(''), (e) => {
                if (e) return cb(e)
                cb(null, counter, columns)
              })
            } else {
              cb(null, counter, columns)
            }
          })
          .on('metadata', (m) => {
            //this is column names
            m.forEach((c) => {
              columns.push(c.name.replace(/_DEC|_IND/g,''))
            })
            opfile.append(columns.join('\t') + '\n', (e) => {
              if (e) return cb(e)
              flag = true
            })
          })
      }
    ],
    (err, rows, columns) => {
      if (err) {
        log.error(err)
        try {
          oracle.release()
        } catch (e) {
          log.error(e)
        }
        return moduleCallback(err)
      }
      moduleCallback(null, rows, columns)
    })

}
