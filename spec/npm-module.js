var assert = require('chai').assert;
var db = require('../');

describe('Testing databridge module exposure', function() {
  it('setup', function() {
    assert(typeof(db.setupConfig) !== 'undefined', 'setupConfig not defined');
    assert(typeof(db.setupConfig) == 'function', 'setupConfig not a function');
  });
  it('config', function() {
    assert(typeof(db.config) !== 'undefined', 'config not defined');
    assert(typeof(db.config) == 'object', 'config not an object');
  });
  it('bridge', function() {
    assert(typeof(db.bridge) !== 'undefined', 'bridge not defined');
    assert(typeof(db.bridge) == 'function', 'bridge not a function');
  });
  it('batchParser', function() {
    assert(typeof(db.batchParse) !== 'undefined', 'batchParse not defined');
    assert(typeof(db.batchParse) == 'function', 'batchParse not a function');
  });
  it('bridgeRunner', function() {
    assert(typeof(db.bridge) !== 'undefined', 'bridge not defined');
    assert(typeof(db.bridge) == 'function', 'bridge not a function');
  });
  it('list src/dest/tables/batches', function() {
    assert(typeof(db.list) !== 'undefined', 'list not defined');
    assert(typeof(db.list) == 'object', 'list not an object');
    var lists = ['src','dest','tables','batches'];
    lists.forEach(function(l) {
      assert(typeof(db.list[l]) !== 'undefined', 'list.' + l + ' not defined');
      assert(typeof(db.list[l]) == 'function', 'list.' + l + ' not a function');
    });
  });
});
