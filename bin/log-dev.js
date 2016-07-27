//development environment log - just log to console
//rather than a log file - see bin/log for more details
//about this module's setup
module.exports = function(opt) {
  var spinner = opt.spinner,
    log = new Object(),
    colors = require('colors');

  console.log('Development log in use.');
  log.g = '';
  log.filename = false;
  log.error = function(err) {
    if (spinner) spinner.stop(true);
    console.log(colors.red(err));
    if (spinner) spinner.start();
    return log;
  };
  log.log = function(msg) {
    if (spinner) spinner.stop(true);
    console.log(log.g + ': ' + msg);
    if (spinner) spinner.start();
    return log;
  };
  log.group = function(str) {
    log.g = str;
    return log;
  };
  return log;
};
