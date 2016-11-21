/**
 * lists installed sources
 */
module.exports = function(cfg) {
  var fs = require('fs'),
    i = fs.readdirSync('./bin/src').filter(function(f) {
      return f.indexOf('.') !== 0;
    }),
    l = fs.readdirSync(cfg.dirs.sources).filter(function(f) {
      return f.indexOf('.') !== 0;
    });

  var noExt = require('./string-utilities').removeFileExtension;

  var a = i.concat(l);

  var s = [];

  a.forEach(function(v) {
    if (s.indexOf(v !== -1)) s.push(noExt(v));
  });

  return (s);
};
