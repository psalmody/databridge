var assert = require('chai').assert;

var arrayEquals = require('../../bin/array-equals');

var a = ['a', 'b', 'c', 'd', 1, 2, 3, 4];
var b = ['a', 'b', 'c', 'd', 1, 2, 3, 4];
var c = ['a', 'b', 'c', 'd', 1, 2, 3];
var d = ['a', 't', 'c', 'd', 1, 2];
var e = {
  "test": true
};
var f = 3;
var g = "testingString";

describe('Testing arrayEquals module', function() {
  it('Returns true for equal arrays', function() {
    assert(arrayEquals(a, b) == true);
  });
  it('Returns false for unequal length arrays', function() {
    assert(arrayEquals(b, c) == false);
  });
  it('Returns false for arrays with some different values', function() {
    assert(arrayEquals(c, d) == false);
  });
  it('Returns false when comparing array to object', function() {
    assert(arrayEquals(a, e) == false);
  });
  it('Returns false if comparing string to array', function() {
    assert(arrayEquals(g, a) == false);
  });
  it('Returns false if comparing number to array', function() {
    assert(arrayEquals(a, f) == false);
  })
})
