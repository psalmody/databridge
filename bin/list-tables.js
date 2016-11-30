/**
 * module - description
 *
 * @param  {string} source name of source
 * @return {array}        all available "tables" for source
 */
module.exports = function(source) {
  if (typeof(source) == 'undefined' || source.trim() == '') return 'Error. No source defined.';
  var fs = require('fs');
  var config = require('../config');
  var noExt = require('./string-utilities').removeFileExtension;
  var arr = [];
  var files = fs.readdirSync(config.dirs.input + source).filter(function(f) {
    return f.indexOf('.') !== 0;
  });
  files.forEach(function(f) {
    arr.push(noExt(f));
  });
  return arr;
};
