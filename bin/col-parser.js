/**
 * Attempts to parse data from the first two lines of the
 * output file and return them as column definitions.
 */
module.exports = (opfile, callback) => {
  const chrono = require('chrono-node')
  let columns = []

  //try and parse SQL data type from javascript data type
  let getType = (c, o) => {
    //if DATE in column title - assume date
    if (c.toUpperCase().indexOf('DATE') > -1) return 'DATE NULL'
    //if TIMESTAMP in column title - assume date
    if (c.toUpperCase().indexOf('TIMESTAMP') > -1) return 'DATE NULL'
    //if _DEC assume decimal
    if (c.toUpperCase().indexOf('_DEC') > -1) return 'DECIMAL NULL'
    //if number - return as INT if no decimal, DEC if dec
    if (o.match(/^-?\d*\.\d*$/g)) return 'DECIMAL NULL'
    if (o.match(/^-?\d*$/g)) return 'INT NULL'
    //try to parse date
    if (chrono.parseDate(o)) return 'DATE NULL'
    //default is a 255 length VARCHAR
    return 'VARCHAR(255) NULL'
  }

  //get first two lines of output file (columns and first row of data)
  opfile.twoLines((err, data) => {
    if (err) return callback(err)
    //c is columns, d is first row of data
    let c = data[0].split('\t')
    let d = data[1].split('\t')

    for (let i = 0; i < c.length; i++) {
      //remove _IND from name
      let name = c[i].replace(/_IND/gi, '').replace(/\ /g, '').replace(/_DEC/gi, '')
      //if _IND in name, index it
      let ndex = c[i].toUpperCase().indexOf('_IND') !== -1 ? true : false
      columns.push({
        name: name,
        type: getType(name, d[i]),
        index: ndex
      })
    }
    callback(null, columns)
  });
};
