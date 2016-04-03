/**
 * Output as CSV to /output/csv/
 * Removes any existing commas before converting
 * output file to csv.
 */
module.exports = function(options, opfile, columns, log, timer, moduleCallback) {
  var table = options.source + '.' + options.table,
    fs = require('fs');

  log.group('CSV Output').log('Copying file from opfile tmp to output/csv/' + table + '.csv');

  fs.readFile(opfile.filename, 'utf-8', function(err, data) {
    if (err) return moduleCallback(err);

    fs.writeFile('./output/csv/' + table + '.csv', data.replace(/,/g, '').replace(/\t/g, ','), 'utf-8', function(err) {
      if (err) return moduleCallback(err);
      log.log('Copied file, removed all , and then replaced tabs with commas.');
      moduleCallback(null, opfile);
    })

  })

}
