var colParser = require('../bin/col-parser');
var fs = require('fs');
var assert = require('chai').assert;
var dirname = __dirname.replace(/\\/g, '/') + '/';
var opfile = {
  twoLines: function(callback) {
    fs.readFile(dirname + 'assets/MOCK_DATA.txt', 'utf-8', function(err, data) {
      if (err) return callback(err);
      var two = data.replace(/\r/g, '').split('\n').slice(0, 2);
      callback(null, two);
    });
  }
};

var expect = [{
  'name': 'id',
  'type': 'VARCHAR(255) NULL',
  'index': true
}, {
  'name': 'first_name',
  'type': 'VARCHAR(255) NULL',
  'index': false
}, {
  'name': 'last_name',
  'type': 'VARCHAR(255) NULL',
  'index': false
}, {
  'name': 'email',
  'type': 'VARCHAR(255) NULL',
  'index': false
}, {
  'name': 'gender',
  'type': 'VARCHAR(255) NULL',
  'index': false
}, {
  'name': 'ip_address',
  'type': 'VARCHAR(255) NULL',
  'index': false
}, {
  'name': 'testing_GPA',
  'type': 'DECIMAL(8,2) NULL',
  'index': false
}, {
  'name': 'testing_DATE',
  'type': 'DATE NULL',
  'index': false
}, {
  'name': 'testing_TIMESTAMP',
  'type': 'DATE NULL',
  'index': false
}, {
  'name': 'testing',
  'type': 'VARCHAR(255) NULL',
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
