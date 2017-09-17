/**
 * test bin/output-file
 */
const fs = require('fs');
const {assert} = require('chai')
const dirname = __dirname.replace(/\\/g, '/') + '/'
let opt = {
  table: 'test_output-file',
  cfg: {
    dirs: {
      output: dirname + 'assets/'
    }
  }
}
const OutputFile = require('../bin/output-file')
const mockFile = './spec/assets/MOCK_DATA.txt';
const mockData = fs.readFileSync(mockFile, 'utf8').replace(/\r/g, '');

describe('Testing output-file', function() {
  it('Creates file', () => {
    opt.opfile = new OutputFile(opt)
    assert(fs.existsSync(opt.opfile.filename), `File does not exist: ${opt.opfile.filename}`)
  });
  it('Appends data', (done) => {
    opt.opfile.append(mockData, function(e) {
      if (e) return done(new Error(e));
      var d = fs.readFileSync(opt.opfile.filename, 'utf8');
      assert(mockData === d, 'mock data does not match opfile.filename data');
      done();
    });
  });
  it('Returns first two lines of file.', (done) => {
    opt.opfile.twoLines(function(e, two) {
      if (e) return done(new Error(e));
      var lines = mockData.split('\n').slice(0, 2)
      assert(JSON.stringify(lines) === JSON.stringify(two), 'Lines do not match. \nShould be: ' + lines + '\nReturned: ' + two);
      done();
    });
  });
  it('Returns sample lines from file (up to 100).', (done) => {
    opt.opfile.sampleLines(function(e, rows, columns) {
      if (e) return done(new Error(e));
      assert(rows.length === 100, '100 sample lines not returned.')
      var mockCols = mockData.split('\n')[0].split('\t')
      assert(JSON.stringify(columns) === JSON.stringify(mockCols), `Columns mistmatched. Should be:\n${mockCols}\nReturned:\n${columns}`)
      done();
    })
  })
  it('Creates write and read stream', function() {
    assert(opt.opfile.writeStream instanceof fs.WriteStream, 'Not instance of write stream.');
    assert(opt.opfile.readStream instanceof fs.ReadStream, 'Not instance of read stream.');
  });
  it('Cleans up file', (done) => {
    opt.opfile.clean(function(e) {
      if (e) return done(new Error(e));
      assert(fs.existsSync(opt.opfile.filename) === false, 'File does not exist. ' + opt.opfile.filename);
      done();
    });
  });
});
