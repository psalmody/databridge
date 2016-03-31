module.exports = function missingKeys(obj, arr) {
  if (typeof(obj) !== 'object') return false;
  if (typeof(arr) !== 'object' || !arr.length) return false;
  var missing = [];
  for (var i = 0; i < arr.length; i++) {
    if (typeof(obj[arr[i]]) == 'undefined') missing.push(arr[i]);
  }
  return missing.length ? missing : false;
}
