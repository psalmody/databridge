/**
 * bin/list-dest - lists installed destinations
 *
 * @param  {object} cfg config.json
 * @return {array}     available destinations
 */
module.exports = function(cfg) {
  var fs = require('fs'),
    i = fs.readdirSync('./bin/dest').filter(function(f) {
      return f.indexOf('.') !== 0;
    }),
    l = fs.readdirSync(cfg.dirs.destinations).filter(function(f) {
      return f.indexOf('.') !== 0;
    });

  var noExt = require('./string-utilities').removeFileExtension;

  var a = cfg.TESTING == true ? i : i.concat(l);

  var s = [];

  a.forEach(function(v) {
    if (s.indexOf(v !== -1)) s.push(noExt(v));
  });

  return (s);
};
