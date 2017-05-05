/**
 * Attempts to parse data from the first two lines of the
 * output file and return them as column definitions.
 */
module.exports = (opfile, callback) => {
  const chrono = require('chrono-node')
  let returnColumns = []

  //run against sample and see if we can't assure the data types are right
  // but we assume the column name can be spoofed
  let typeCheck = (a, c) => {
    //if DATE in column title - assume date
    if (c.toUpperCase().indexOf('DATE') > -1) return 'DATE'
    //if TIMESTAMP in column title - assume date
    if (c.toUpperCase().indexOf('TIMESTAMP') > -1) return 'DATE'
    //if _DEC assume decimal
    if (c.toUpperCase().indexOf('_DEC') > -1) return 'FLOAT(10)'

    //check functions
    let isBlank = (e) => {
      return e === ''
    }
    let isDec = (e) => {
      if (e === '') return true
      return e.match(/^-?\d*\.?\d*$/g)
    }
    //try to parse from array
    if (a.every(isBlank)) return 'VARCHAR(255)'
    if (a.every(isDec)) return 'FLOAT(10)'

    //default
    return 'VARCHAR(255)'
  }

  //get sample of lines of output file (columns and first row of data)
  opfile.sampleLines((err, rows, colNames) => {
    if (err) return callback(err)

    //push data into R-style arrays (one array of per column)
    // so firt column (name id_IND) = [1, 2, 3, 4, 5]
    let columns = []
    for (let i = 0; i < colNames.length; i++) {
      columns[i] = []
    }
    for (let i = 0; i < rows.length; i++) {
      let cells = rows[i].split('\t')
      for (let j = 0; j < cells.length; j++) {
        columns[j][i] = cells[j]
      }
    }
    columns.forEach((values, i) => {
      let ndex = colNames[i].toUpperCase().indexOf('_IND') !== -1 ? true : false
      returnColumns.push({
        name: colNames[i],
        type: typeCheck(values, colNames[i]),
        index: ndex
      })
    })
    callback(null, returnColumns)
  })
}
