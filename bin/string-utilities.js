function removeFileExtension(str) {
  if (typeof(str) !== 'string') throw new Error('removeFileExtension: Parameter must be a string.');
  var s = str.split('.');
  s.pop();
  return s.join('.');
}


module.exports = {
  removeFileExtension: removeFileExtension
}
