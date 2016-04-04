//development environment log - just log to console
//rather than a log file - see bin/log for more details
//about this module's setup
module.exports = function(table) {
  console.log('Development log in use.');
  var log = new Object();
  var colors = require('colors');
  log.g = '';
  log.filename = false;
  log.error = function(err) {
    console.log(colors.red(err));
    return log;
  }
  log.log = function(msg) {
    console.log(log.g + ': ' + msg);
    return log;
  }
  log.group = function(str) {
    log.g = str;
    return log;
  }
  return log;
}
