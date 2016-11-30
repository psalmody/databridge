/**
 * bin/list-batches - get list of available batches
 *
 * @return {array}  list of available batches
 */
module.exports = function() {
  var fs = require('fs');
  var config = require('../config');
  var noExt = require('./string-utilities').removeFileExtension;
  var arr = [];
  var files = fs.readdirSync(config.dirs.batches).filter(function(f) {
    return f.indexOf('.') !== 0;
  });
  files.forEach(function(f) {
    arr.push(noExt(f));
  });
  return arr;
};
