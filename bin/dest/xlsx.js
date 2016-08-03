module.exports = function(opt, columns, moduleCallback) {

  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
  var filename = opt.cfg.dirs.output + 'xlsx/' + dir + '/' + opt.destination + '.' + opt.table + '.xlsx',
    fs = require('fs'),
    Excel = require('exceljs'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    log = opt.log,
    opfile = opt.opfile,
    rowsProcessed = 0;

  //setup workbook and columns
  var workbook = new Excel.Workbook();
  workbook.creator = 'databridge';
  workbook.created = new Date();
  workbook.modified = new Date();

  var worksheet = workbook.addWorksheet('Sheet 1');

  var firstRow = [];

  for (var i = 0; i < columns.length; i++) {
    firstRow.push(columns[i].name);
  }

  worksheet.addRow(firstRow);
  worksheet.getRow(1).font = {
    bold: true
  };

  async.waterfall([
    //mkdirp
    function(cb) {
      mkdirp(opt.cfg.dirs.output + 'xlsx/' + dir, function(err) {
        if (err) return cb(err);
        cb(null);
      });
    },
    //read data
    function(cb) {
      fs.readFile(opfile.filename, 'utf-8', function(err, data) {
        if (err) return cb(err);
        data = data.split('\n');
        data.shift();
        cb(null, data);
      });
    },
    function(data, cb) {
      var first = true;
      data.forEach(function(row) {
        if (!first) rowsProcessed++;
        if (first) first = false;
        worksheet.addRow(row.split('\t'));
      });
      cb(null);
    },
    //write xlsx file
    function(cb) {
      workbook.xlsx.writeFile(filename).then(function() {
        cb(null);
      });
    }
  ], function(err) {
    if (err) return moduleCallback(err);
    //exceljs arrays are all 1 based so remove first item
    var cols = worksheet.getRow(1).values;
    cols.shift();
    moduleCallback(null, rowsProcessed, cols);
  });
};
