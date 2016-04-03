/**
 * Checks object for missing keys and returns
 * any that are missing or false if no keys missing
 */
module.exports = function missingKeys(obj, arr) {
  //if not an object - return
  if (typeof(obj) !== 'object') return false;
  //array required
  if (typeof(arr) !== 'object' || !arr.length) return false;
  var missing = [];
  //loop through arr and check for those object properties
  for (var i = 0; i < arr.length; i++) {
    if (typeof(obj[arr[i]]) == 'undefined') missing.push(arr[i]);
  }
  return missing.length ? missing : false;
}
