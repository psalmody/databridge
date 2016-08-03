/**
 * Utility to handle adding / removing default bind variables
 */
var c = require('../config.json'),
  fs = require('fs');

var list = function() {
  return c.defaultBindVars;
};

var exists = function(key) {
  return (typeof(c.defaultBindVars[key]) == 'undefined') ? false : true;
};

var add = function(key, value, confirm) {
  if (key.indexOf(' ') !== -1) throw new Error('No spaces allowed in variable names.');
  confirm = (typeof(confirm) == 'undefined') ? false : confirm;
  if (Object.keys(c.defaultBindVars).indexOf(key) !== -1 && !confirm) {
    return 'Exists. 3rd parameter true will overwrite.';
  }
  c.defaultBindVars[key] = value;
  write();
  return true;
};

var remove = function(key) {
  if (typeof c.defaultBindVars[key] == 'undefined') throw new Error('Key ' + key + ' not defined.');
  delete c.defaultBindVars[key];
  write();
  return true;
};

var write = function() {
  var r = fs.writeFileSync('config.json', JSON.stringify(c, null, 2));
  return r;
};

var getValue = function(key) {
  return c.defaultBindVars[key];
};

module.exports = {
  add: add,
  exists: exists,
  remove: remove,
  list: list,
  getValue: getValue
};
