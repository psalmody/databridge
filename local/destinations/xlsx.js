module.exports = function(opt, columns, moduleCallback) {

  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
  var filename = opt.cfg.dirs.output + 'xlsx/' + dir + '/' + opt.source + '.' + opt.table + '.xlsx',
    fs = require('fs'),
    Excel = require('exceljs'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    log = opt.log,
    opfile = opt.opfile,
    timer = opt.timer;

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
  worksheet.getRow(1).font = {
    bold: true
  }


  async.waterfall([
    //mkdirp
    function(cb) {
      log.group('XLSX Destination').log('Creating directory for output in ' + opt.cfg.dirs.output + 'xlsx/' + dir);
      mkdirp(opt.cfg.dirs.output + 'xlsx/' + dir, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    },
    //read data
    function(cb) {
      log.log('Reading data....');
      fs.readFile(opfile.filename, 'utf-8', function(err, data) {
        if (err) return cb(err);
        var data = data.split('\n');
        data.shift();
        log.log('')
        cb(null, data);
      })
    },
    function(data, cb) {
      log.log('Split data into ' + data.length + ' rows and writing to workbook.');
      data.forEach(function(row) {
        worksheet.addRow(row.split('\t'));
      })
      cb(null);
    },
    //write xlsx file
    function(cb) {
      workbook.xlsx.writeFile(filename).then(function() {
        log.log('Created workbook ' + filename);
        cb(null);
      })
    }
  ], function(err) {
    if (err) return moduleCallback(err);
    moduleCallback(null);
  })











}
