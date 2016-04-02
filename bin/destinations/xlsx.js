module.exports = function(options, opfile, columns, log, timer, moduleCallback) {
  var filename = './output/xlsx/' + options.source + '.' + options.table + '.xlsx',
    fs = require('fs'),
    Excel = require('exceljs');



  var workbook = new Excel.Workbook();

  workbook.creator = 'dbutil';
  workbook.created = new Date();
  workbook.modified = new Date();

  var worksheet = workbook.addWorksheet('Sheet 1');

  console.log(columns);

  var firstRow = [];

  for (var i = 0; i < columns.length; i++) {
    firstRow.push(columns[i].name);
  }

  worksheet.addRow(firstRow);

  workbook.xlsx.writeFile(filename).then(function() {
    moduleCallback(null, opfile);
  })


}
