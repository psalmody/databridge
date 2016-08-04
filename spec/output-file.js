/**
 * test bin/output-file
 */
var fs = require('fs');
var assert = require('chai').assert;
var dirname = __dirname.replace(/\\/g, '/') + '/';
var opt = {
  table: 'test_output-file',
  cfg: {
    dirs: {
      output: dirname + 'assets/'
    }
  }
};
var outputFile = require('../bin/output-file');
var opfile;
var appendData = {
  test: 'test',
  test45: 'test 45',
  how_DATE: 'sdfskdjf',
  tessdft: 1
};
var appendJson = JSON.stringify(appendData, null, 2);

describe('Testing output-file', function() {
  it('Creates file', function(done) {
    outputFile(opt, function(e, f) {
      if (e) return done(new Error(e));
      opfile = f;
      assert(fs.existsSync(opfile.filename), 'File does not exist. ' + opfile.filename);
      done();
    });
  });
  it('Appends data', function(done) {
    opfile.append(JSON.stringify(appendData, null, 2), function(e) {
      if (e) return done(new Error(e));
      var d = fs.readFileSync(opfile.filename);
      assert(JSON.stringify(appendData, null, 2) == d);
      done();
    });
  });
  it('Returns first two lines of file.', function(done) {
    opfile.twoLines(function(e, two) {
      if (e) return done(new Error(e));
      var lines = appendJson.split('\n');
      assert(lines[0] == two[0] && lines[1] == two[1], 'Lines do not match. Expected:\n' + lines[0] + '\n'+ lines[1] + '\nReturned:\n' + two[0] + '\n' + two[1]);
      done();
    });
  });
  it('Creates write and read stream', function() {
    assert(opfile.createWriteStream() instanceof fs.WriteStream, 'Not instance of write stream.');
    assert(opfile.createReadStream() instanceof fs.ReadStream, 'Not instance of read stream.');
  });
  it('Cleans up file', function(done) {
    opfile.clean(function(e) {
      if (e) return done(new Error(e));
      assert(fs.existsSync(opfile.filename) === false, 'File does not exist. ' + opfile.filename);
      done();
    });
  });
});
