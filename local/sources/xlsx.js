module.exports = function(opt, moduleCallback) {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table/file required for this xlsx source.');
  var fs = require('fs'),
    filename = opt.cfg.dirs.input + 'xlsx/' + opt.table + '.xlsx',
    Excel = require('exceljs'),
    workbook = new Excel.Workbook(),
    async = require('async'),
    log = opt.log,
    opfile = opt.opfile,
    timer = opt.timer,
    worksheet;

  async.waterfall([
      //read xlsx file - streaming support is iffy for exceljs
      function(cb) {
        log.group('XLSX').log('Reading file...');
        workbook.xlsx.readFile(filename).then(function() {
          worksheet = workbook.getWorksheet(1);
          cb(null);
        })
      },
      //process columns
      function(cb) {
        log.log('Using first row as columns.');
        var cols = [];
        var row = worksheet.getRow(1).eachCell(function(cell, colNumber) {
          cols.push(cell.value);
        });
        opfile.append(cols.join('\t') + '\n', function(err) {
          if (err) return cb(err);
          cb(null);
        });
      },
      //process rows
      function(cb) {
        log.log('Reading rest of rows.');
        var rows = [];
        var first = true;
        //each row - push to array
        worksheet.eachRow(function(row) {
            if (first) return first = false;
            var cells = [];
            //each cell push to array, join with \t
            row.eachCell(function(cell) {
              cells.push(cell.value);
            })
            rows.push(cells.join('\t'));
          })
          //join rows with \n and put in opfile
        opfile.append(rows.join('\n'), function(err) {
          log.log('Added ' + (rows.length - 1) + ' rows. Sending to destination.');
          if (err) return cb(err);
          cb(null);
        })
      }
    ],
    function(err) {
      if (err) return moduleCallback(err);
      log.group('Finished source').log(timer.now.str());
      moduleCallback(null);
    })
}
