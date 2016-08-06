module.exports = function(source) {
  if (typeof(source) == 'undefined' || source.trim() == '') return 'Error. No source defined.';
  var fs = require('fs');
  var config = require('../config');
  var noExt = require('./string-utilities').removeFileExtension;
  var arr = [];
  var files = fs.readdirSync(config.dirs.input + source);
  files.forEach(function(f) {
    arr.push(noExt(f));
  });
  return arr;
}
