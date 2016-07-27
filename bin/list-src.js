/**
 * lists installed sources
 */
module.exports = function(cfg) {
  var fs = require('fs'),
    i = fs.readdirSync('./bin/src'),
    l = fs.readdirSync(cfg.dirs.sources);

  var noExt = require('./string-utilities').removeFileExtension;

  var a = i.concat(l);

  var s = [];

  a.forEach(function(v) {
    if (s.indexOf(v !== -1)) s.push(noExt(v));
  });

  return (s);
};
