//testing log - only output errors
module.exports = function(opt) {
  var log = new Object();
  log.g = '';
  log.filename = false;
  log.error = function(err) {
    console.error(err);
    return log;
  };
  log.log = function(msg) {
    return log;
  };
  log.group = function(str) {
    return log;
  };
  return log;
}
