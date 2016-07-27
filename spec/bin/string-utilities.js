var assert = require('chai').assert;
var stringUtilities = require('../../bin/string-utilities');

describe('Testing string-utilities', function() {
  describe('Testing removeFileExtension', function() {
    var rFE = stringUtilities.removeFileExtension;
    it('Removes file extension from file with extension', function() {
      var file = 'test/test.js';
      var r = rFE(file);
      assert(r == 'test/test', 'Returned ' + r + ' but expected test/test');
    });
    it('Leaves previous periods in file but still removes extension', function() {
      var file = 'test.test.js';
      var r = rFE(file);
      assert(r == 'test.test', 'Returned ' + r + ' but expected test/test');
    });
    it('Throws an error if not passed a string', function() {
      assert.throws(function() {
        rFE(['test']);
      }, Error, 'Parameter');
    });
  });
});
