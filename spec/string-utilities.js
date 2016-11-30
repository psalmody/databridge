var assert = require('chai').assert;
var stringUtilities = require('../bin/string-utilities');

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
  describe('Testing cdDotDot', function() {
    var cdd = stringUtilities.cdDotDot;
    var path = require('path');
    var expect = path.normalize(__dirname + '/../').replace(/\\/g, '/');
    it('Returns error for nonexistent filename or directory.', function() {
      var r = cdd(expect + '/asldkfjaklsdfjlaksjfklasjdflkasdjf/');
      assert(r instanceof Error, 'Error not returned. Returned instead: ' + typeof(r));
    });
    it('Returns forward slash directories.', function() {
      var r = cdd(__dirname.replace(/\//g, '\\'));
      assert(!(r instanceof Error), r.toString());
      assert(r.indexOf('\\') == -1, r);
    });
    it('Bumps up one directory when given filename.', function() {
      var r = cdd(expect + 'spec/string-utilities.js');
      assert(r === expect, r);
    });
    it('Bumps up one directory when given dir w/ trailing slash.', function() {
      var r = cdd(expect + 'spec/');
      assert(r === expect, r);
    });
    it('Bumps up one directory when given dir w/o trailing slash.', function() {
      var r = cdd(expect + 'spec');
      assert(r === expect, r);
    });
  });
});
