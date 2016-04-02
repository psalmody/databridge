module.exports = function(options, opfile, columns, log, timer, moduleCallback) {


  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
  var filename = './output/xlsx/' + dir + '/' + options.source + '.' + options.table + '.xlsx',
    fs = require('fs'),
    Excel = require('exceljs'),
    async = require('async'),
    mkdirp = require('mkdirp');

  //setup workbook and columns
  var workbook = new Excel.Workbook();
  workbook.creator = 'dbutil';
  workbook.created = new Date();
  workbook.modified = new Date();

  var worksheet = workbook.addWorksheet('Sheet 1');

  var firstRow = [];

  for (var i = 0; i < columns.length; i++) {
    firstRow.push(columns[i].name);
  }

  worksheet.addRow(firstRow);

  async.waterfall([
    //mkdirp
    function(cb) {
      mkdirp('./output/xlsx/' + dir, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    //read data
    function(cb) {
      fs.readFile(opfile.filename, 'utf-8', function(err, data) {
        if (err) return cb(err);
        var data = data.split('\n');
        data.shift();
        cb(null, data);
      })
    },
    function(data, cb) {
      data.forEach(function(row) {
        worksheet.addRow(row.split('\t'));
      })
      cb(null);
    },
    //write xlsx file
    function(cb) {
      workbook.xlsx.writeFile(filename).then(function() {
        cb(null);
      })
    }
  ], function(err) {
    if (err) return moduleCallback(err);
    log.log('Created xlsx file at ' + filename);
    moduleCallback(null, opfile);
  })











}
