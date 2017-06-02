var colParser = require('../bin/col-parser');
var fs = require('fs');
var assert = require('chai').assert;
var dirname = __dirname.replace(/\\/g, '/') + '/';
var opfile = {
  sampleLines: function(callback) {
    callback = typeof(callback) == 'undefined' ? function() {
      return;
    } : callback;
    fs.readFile(dirname + 'assets/MOCK_DATA.txt', 'utf-8', 'utf-8', function(err, data) {
      if (err) return callback(err);
      var returnArray = []
      var lines = data.replace(/\r/g, '').split('\n')

      var times = Math.min(lines.length - 1, 100)

      for (var i = 0; i < times; i++) {
        returnArray.push(lines[Math.floor(Math.random() * (lines.length - 1)) + 2])
      }
      //returns no error, random sampling of up to 100 lines (or all the lines if less than 100) and column names in array
      callback(null, returnArray, lines[0].split('\t'))
    });
  }
};

var expect = [{
  'name': 'id',
  'type': 'FLOAT(53)',
  'index': true
}, {
  'name': 'first_name',
  'type': 'VARCHAR(255)',
  'index': false
}, {
  'name': 'last_name',
  'type': 'VARCHAR(255)',
  'index': false
}, {
  'name': 'email',
  'type': 'VARCHAR(255)',
  'index': false
}, {
  'name': 'gender',
  'type': 'VARCHAR(255)',
  'index': false
}, {
  'name': 'ip_address',
  'type': 'VARCHAR(255)',
  'index': false
}, {
  'name': 'testing_GPA',
  'type': 'FLOAT(53)',
  'index': false
}, {
  'name': 'testing_DATE',
  'type': 'DATE',
  'index': false
}, {
  'name': 'testing_TIMESTAMP',
  'type': 'DATE',
  'index': false
}, {
  'name': 'testing',
  'type': 'FLOAT(53)',
  'index': false
}];

describe('Testing colParser', function() {
  it('Parses columns without error', function(done) {
    colParser(opfile, function(err, columns) {
      if (err) return done(new Error(err));
      var x = JSON.stringify(expect);
      var y = JSON.stringify(columns);
      assert(x === y, 'Column data mismatch. \nExpected:\n  ' + x + '\nReturned:\n  ' + y);
      done();
    });
  });
});
