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
      function(cb) {
        log.group('XLSX').log('Reading file...');
        workbook.xlsx.readFile(filename).then(function() {
          worksheet = workbook.getWorksheet(1);
          cb(null);
        })
      },
      function(cb) {
        //process columns
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
      function(cb) {
        log.log('Reading rest of rows.');
        //process rows
        var rows = [];
        var first = true;
        worksheet.eachRow(function(row) {
          if (first) return first = false;
          var cells = [];
          row.eachCell(function(cell) {
            cells.push(cell.value);
          })
          rows.push(cells.join('\t'));
        })
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
