var assert = require('chai').assert;

var missingKeys = require('../../bin/missing-keys');

var obj = {
  'one': 1,
  'two': 2,
  'three': 3
};

var arr = ['one', 'two', 'three'];
var arr2 = ['one', 'two', 'four'];

describe('Testing bin/missing-keys', function() {
  it('Throws error when passed string, array', function() {
    assert.throws(function() {
      missingKeys('test', arr);
    }, Error, 'parameter must be');
  });
  it('Throws error when passed object, string', function() {
    assert.throws(function() {
      missingKeys(obj, 'string');
    }, Error, 'parameter must be');
  });
  it('Throws error when passed string, string', function() {
    assert.throws(function() {
      missingKeys('string', 'string');
    }, Error, 'parameter must be');
  });
  it('Returns false when obj contains all array keys', function() {
    var r = missingKeys(obj, arr);
    assert(r == false, r);
  });
  it('Returns missing keys array when obj is missing keys', function() {
    var r = missingKeys(obj, arr2);
    assert(r instanceof Array, 'Did not return array: ' + r);
    assert(r.length == 1, 'Array returned was longer than one elment: ' + r.toString());
    assert(r.indexOf('four') == 0, 'Array returned did not contain \'four\': ' + r.toString());
  });
});
