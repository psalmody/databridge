function removeFileExtension(str) {
  if (typeof(str) !== 'string') throw new Error('removeFileExtension: Parameter must be a string.');
  var s = str.split('.');
  if (s.length == 1) return s;
  s.pop();
  return s.join('.');
}

function cdDotDot(p) {
  var path = require('path');
  var newPath = path.normalize(p).replace(/\\/g, '/');
  var fs = require('fs');
  if (!fs.existsSync(newPath)) return new Error('File ' + newPath + ' does not exist.');
  var stat = fs.lstatSync(newPath);
  var sliceBy = (stat.isFile() || newPath.substr(newPath.length - 1) == '/') ? -2 : -1;
  return newPath.split('/').slice(0, sliceBy).join('/').replace(/\\/g, '/') + '/';
}


module.exports = {
  removeFileExtension: removeFileExtension,
  cdDotDot: cdDotDot
};
