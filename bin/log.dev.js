//development environment log - just log to console
//rather than a log file - see bin/log for more details
//about this module's setup
module.exports = function(table, batch, spinner) {
  console.log('Development log in use.');
  var log = new Object();
  var colors = require('colors');
  log.g = '';
  log.filename = false;
  log.error = function(err) {
    spinner.stop(true);
    console.log(colors.red(err));
    spinner.start();
    return log;
  }
  log.log = function(msg) {
    spinner.stop(true);
    console.log(log.g + ': ' + msg);
    spinner.start();
    return log;
  }
  log.group = function(str) {
    log.g = str;
    return log;
  }
  return log;
}
