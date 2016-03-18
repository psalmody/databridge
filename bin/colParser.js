module.exports = function(opfile, callback) {
  //TODO this should run during source, not in main app
  var fs = require('fs'),
    columns = [];

  function getType(c, o) {
    if (c.indexOf('GPA') > -1) return 'DECIMAL(4,2)';
    if (c.indexOf('DATE') > -1) return 'DATE';
    if (typeof(o) == 'number') return 'INT';
    return 'VARCHAR(255)';
  }

  opfile.twoLines(function(err, data) {
    if (err) callback(err);
    var c = data[0].split('\t');
    var d = data[1].split('\t');

    for (var i = 0; i < c.length; i++) {
      var name = c[i].replace('_IND', '').replace(/\ /g, '');
      var ndex = c[i].indexOf('_IND') !== -1 ? true : false;
      columns.push({
        name: name,
        type: getType(name, d[i]),
        index: ndex
      })
    }
    callback(null, columns);
  })
}
