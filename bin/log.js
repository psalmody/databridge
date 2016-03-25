var fs = require('fs'),
  mkdirp = require('mkdirp');


module.exports = function(table) {

  var log = new Object();
  log.g = '';
  var dt = new Date(),
    dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
  var first = true;

  log.filename = 'logs/' + dir + '/' + table + '.' + Math.round(Date.now() / 1000) + '.log.txt';

  mkdirp('logs/' + dir, function(err) {
    if (err) return console.error(err);
  })

  fs.writeFile(log.filename, process.argv.join(' ') + '\n', function(err) {
    if (err) return console.error(err);
  })

  log.error = function(err) {
    if (first) {
      fs.appendFile(log.filename, dt.toString() + '\n');
      first = false;
    }
    return fs.appendFile(log.filename, 'Error! ' + log.g + ': ' + JSON.stringify(err, null, 2) + "\n");
  };

  log.log = function(msg) {
    if (first) {
      fs.appendFile(log.filename, dt.toString() + '\n');
      first = false;
    }
    return fs.appendFile(log.filename, log.g + ': ' + msg + "\n");
  };

  log.group = function(str) {
    log.g = str;
    return log;
  }

  return log;

}
