function removeFileExtension(str) {
  var s = str.split('.');
  s.pop();
  return s.join('.');
}


module.exports = {
  removeFileExtension: removeFileExtension
}
