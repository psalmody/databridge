module.exports = function() {
  var fs = require('fs');
  var config = require('../config');
  var noExt = require('./string-utilities').removeFileExtension;
  var arr = [];
  var files = fs.readdirSync(config.dirs.batches);
  files.forEach(function(f) {
    arr.push(noExt(f));
  });
  return arr;
};
