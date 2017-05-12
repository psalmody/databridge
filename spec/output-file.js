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
var mockFile = './spec/assets/MOCK_DATA.txt';
let mockData = fs.readFileSync(mockFile, 'utf8').replace(/\r/g, '');

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
    opfile.append(mockData, function(e) {
      if (e) return done(new Error(e));
      var d = fs.readFileSync(opfile.filename, 'utf8');
      assert(mockData === d, 'mock data does not match opfile.filename data');
      done();
    });
  });
  it('Returns first two lines of file.', function(done) {
    opfile.twoLines(function(e, two) {
      if (e) return done(new Error(e));
      var lines = mockData.split('\n').slice(0, 2)
      assert(JSON.stringify(lines) === JSON.stringify(two), 'Lines do not match. \nShould be: ' + lines + '\nReturned: ' + two);
      done();
    });
  });
  it('Returns sample lines from file (up to 100).', function(done) {
    opfile.sampleLines(function(e, rows, columns) {
      if (e) return done(new Error(e));
      assert(rows.length === 100, '100 sample lines not returned.')
      var mockCols = mockData.split('\n')[0].split('\t')
      assert(JSON.stringify(columns) === JSON.stringify(mockCols), `Columns mistmatched. Should be:\n${mockCols}\nReturned:\n${columns}`)
      done();
    })
  })
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
