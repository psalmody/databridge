/**
 * Logger - piped between source and destination so there
 *   is only one log per bridge run.
 */
var fs = require('fs'),
  mkdirp = require('mkdirp');

//if development environment, use development log instead
if (process.env.NODE_ENV.trim() == 'development') return module.exports = require('./log.dev');

//production log
module.exports = function(table, batch) {
  //if batch, put logs inside additional folder to keep them together
  var batch = typeof(batch) == 'undefined' ? '' : batch + '/';
  var log = new Object();
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
  })

  //log command line call
  fs.appendFile(log.filename, process.argv.join(' ') + '\n', function(err) {
    if (err) return console.error(err);
  })

  //log.error - includes Error! at beginning
  log.error = function(err) {
    if (first) {
      fs.appendFile(log.filename, dt.toString() + '\n');
      first = false;
    }
    fs.appendFile(log.filename, 'Error! ' + log.g + ': ' + JSON.stringify(err, null, 2) + "\n");
    return log;
  };

  //log.log - regular loggin function
  log.log = function(msg) {
    if (first) {
      fs.appendFile(log.filename, dt.toString() + '\n');
      first = false;
    }
    fs.appendFile(log.filename, log.g + ': ' + msg + "\n");
    return log;
  };

  //set log.g
  log.group = function(str) {
    log.g = str;
    return log;
  }

  return log;

}
