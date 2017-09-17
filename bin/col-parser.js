/**
 * Attempts to parse data from the first two lines of the
 * output file and return them as column definitions.
 */
module.exports = (opfile, callback) => {
  let returnColumns = []

  //run against sample and see if we can't assure the data types are right
  // but we assume the column name can be spoofed
  let typeCheck = (a, c) => {
    //if DATE in column title - assume date
    if (c.toUpperCase().indexOf('DATE') > -1) return 'DATE'
      //if TIMESTAMP in column title - assume date
    if (c.toUpperCase().indexOf('TIMESTAMP') > -1) return 'DATE'
      //if _DEC assume decimal
    if (c.toUpperCase().indexOf('_DEC') > -1) return 'FLOAT(53)'

    //try to parse from array
    if (a.every(e => e === '')) return 'VARCHAR(255)'
    if (a.every(e => e.match(/^-?\d*\.?\d*$/g))) return 'FLOAT(53)'

    //default
    return 'VARCHAR(255)'
  }

  //get sample of lines of output file (columns and first row of data)
  opfile.sampleLines((err, rows, colNames) => {
    if (err) return callback(err)
    if (!rows.length) callback('No rows returned from opfile.sampleLines' + JSON.stringify(rows) + JSON.stringify(colNames))

    //push data into R-style arrays (one array of per column)
    // so first column (name id_IND) = [1, 2, 3, 4, 5]
    let columns = []
    rows.forEach(r => {
      if (!r) return true
      let cells = r.split('\t')
      for (let i = 0; i < colNames.length; i++) {
        columns[i] = columns[i] || []
        let v = cells[i] || ''
        columns[i].push(v)
      }
    })
    columns.forEach((values, i) => {
      let ndex = colNames[i].toUpperCase().indexOf('_IND') !== -1 ? true : false
      returnColumns.push({
        name: colNames[i].replace(/_IND|_DEC/g, ''),
        type: typeCheck(values, colNames[i]),
        index: ndex
      })
    })
    callback(null, returnColumns)
  })
}
