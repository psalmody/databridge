/**
 * Attempts to parse data from the first two lines of the
 * output file and return them as column definitions.
 */
module.exports = function(opfile, callback) {
  var fs = require('graceful-fs'),
    columns = [];

  //try and parse SQL data type from javascript data type
  function getType(c, o) {
    //if GPA is in column title - it's a decimal
    if (c.toUpperCase().indexOf('GPA') > -1) return 'DECIMAL(4,2) NULL';
    //if DATE in column title - assume date
    if (c.toUpperCase().indexOf('DATE') > -1) return 'DATE NULL';
    //if TIMESTAMP in column title - assume date
    if (c.toUpperCase().indexOf('TIMESTAMP') > -1) return 'DATE NULL';
    //if _DEC assume decimal
    if (c.toUpperCase().indexOf('_DEC') > -1) return 'DECIMAL(4,2) NULL';
    //if number - return as INT
    if (typeof(o) == 'number') return 'INT NULL';
    //default is a 255 length VARCHAR
    return 'VARCHAR(255) NULL';
  }

  //get first two lines of output file (columns and first row of data)
  opfile.twoLines(function(err, data) {
    if (err) callback(err);
    //c is columns, d is first row of data
    var c = data[0].split('\t');
    var d = data[1].split('\t');

    for (var i = 0; i < c.length; i++) {
      //remove _IND from name
      var name = c[i].replace(/_IND/gi, '').replace(/\ /g, '').replace(/_DEC/gi, '');
      //if _IND in name, index it
      var ndex = c[i].toUpperCase().indexOf('_IND') !== -1 ? true : false;
      columns.push({
        name: name,
        type: getType(name, d[i]),
        index: ndex
      })
    }
    callback(null, columns);
  })
}
