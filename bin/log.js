/**
 * Logger - piped between source and destination so there
 *   is only one log per bridge run.
 */
var fs = require('graceful-fs'),
  mkdirp = require('mkdirp');

//production log
module.exports = function(opt) {
  //if batch, put logs inside additional folder to keep them together
  var batch = typeof(opt.batch) == 'undefined' ? '' : batch + '/';
  var table = opt.table;
  var log = new Object();
  var spinner = opt.spinner;
  //log group is prepended to every log call
  log.g = '';
  //log folder settings
  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
  //for first log time - need to log start time
  var first = true;
  //log location
  log.filename = 'logs/' + dir + '/' + batch + table + '.' + Math.round(Date.now() / 1000) + '.log.txt';

  //use mkdirp to make log folders recursively if not existing
  mkdirp('logs/' + dir + '/' + batch, function(err) {
    if (err) return console.error(err);
    //log command line call
    fs.appendFileSync(log.filename, process.argv.join(' ') + '\n');
  })



  //log.error - includes Error! at beginning
  log.error = function(err) {
    if (first) {
      fs.appendFileSync(log.filename, dt.toString() + '\n');
      first = false;
    }
    fs.appendFileSync(log.filename, 'Error! ' + log.g + ': ' + JSON.stringify(err, null, 2) + "\n");
    return log;
  };

  //log.log - regular loggin function
  log.log = function(msg) {
    if (first) {
      fs.appendFileSync(log.filename, dt.toString() + '\n');
      first = false;
    }
    fs.appendFileSync(log.filename, log.g + ': ' + msg + "\n");
    return log;
  };

  //set log.g
  log.group = function(str) {
    log.g = str;
    return log;
  }

  return log;

}
