var assert = require('chai').assert;

//setup response
var res;

function reset(up) {
  var opt = {
    source: 'rptp',
    table: 'anchorage_usernames',
    destination: 'mssql',
    log: {
      filename: 'test.log'
    }
  };
  if (up) opt.update = true;
  res = require('../../bin/response')(opt);
  return true;
}

//require with settings once
reset();


describe('Testing bin\\response module', function() {
  it('log a source error', function() {
    res.source.error('!!');
    assert(res.source.errorMsg == '!!', 'Error string was not logged');
  });
  it('give a source error with .check()', function() {
    var check = res.check();
    assert(check[0] == 'Source error.', 'Returned wrong error: ' + JSON.stringify(check));
  });
  it('reset', function() {
    assert(reset());
  });
  it('log a destination error', function() {
    res.destination.error('!!');
    assert(res.destination.errorMsg == '!!', 'Error string was not logged');
  });
  it('give a destination error with .check()', function() {
    var check = res.check();
    assert(check[0] == 'Destination error.', 'Returned wrong error: ' + JSON.stringify(check));
  });
  it('reset', function() {
    assert(reset());
  });
  it('log a source status, rows, columns with .respond()', function() {
    res.source.respond('fine', 12, ['a', 'b', 'c']);
    assert(res.source.response == 'fine', 'bad status');
    assert(res.source.rows == 12, 'bad row number');
    assert(res.source.columns.length == 3, 'bad column array length');
  });
  it('not pass .check() (no destination yet)', function() {
    var check = res.check();
    assert(check[0] == 'No response from destination object.', 'Wrong error: ' + JSON.stringify(check));
  });
  it('log a destination status, rows, columns with .respond()', function() {
    res.destination.respond('fine', 12, ['a', 'b', 'c']);
    assert(res.destination.response == 'fine', 'bad status');
    assert(res.destination.rows == 12, 'bad row number');
    assert(res.destination.columns.length == 3, 'bad column array length');
  });
  it('pass .check()', function() {
    var check = res.check();
    assert(check === null, 'Bad response: ' + JSON.stringify(check));
  });
  it('reset', function() {
    assert(reset());
  });
  it('logged a source and destination response and the columns did not match', function() {
    res.source.respond('fine', 12, ['a', 'c']);
    assert(res.source.response == 'fine', 'bad source status');
    assert(res.source.rows == 12, 'bad source row number');
    assert(res.source.columns.length == 2, 'bad source column array length');
    res.destination.respond('fine', 12, ['a', 'b', 'c']);
    assert(res.destination.response == 'fine', 'bad destination status');
    assert(res.destination.rows == 12, 'bad destination row number');
    assert(res.destination.columns.length == 3, 'bad destination column array length');
  });
  it('gave a columns error', function() {
    var check = res.check();
    assert(check[0] == 'Column mismatch.', "Bad error: " + JSON.stringify(check));
  });
  it('reset', function() {
    assert(reset());
  });
  it('logged a source and destination response and the rows did not match', function() {
    res.source.respond('fine', 14, ['a', 'b', 'c']);
    assert(res.source.response == 'fine', 'bad source status');
    assert(res.source.rows == 14, 'bad source row number');
    assert(res.source.columns.length == 3, 'bad source column array length');
    res.destination.respond('fine', 12, ['a', 'b', 'c']);
    assert(res.destination.response == 'fine', 'bad destination status');
    assert(res.destination.rows == 12, 'bad destination row number');
    assert(res.destination.columns.length == 3, 'bad destination column array length');
  });
  it('gave a rows error', function() {
    var check = res.check();
    assert(check[0] == 'Row mismatch.', "Bad error: " + JSON.stringify(check));
  });
  it('gave a rows error when update and column returned less than source', function() {
    //reset with update true
    reset(true);
    res.source.respond('fine', 20, ['a', 'b', 'c']);
    res.destination.respond('fine', 10, ['a', 'b', 'c']);
    var check = res.check();
    assert(check[0] == 'Update specified but destination says it has less rows than source.', 'Bad response from .check(): ' + check[0]);
  });
  it('gave no rows error when update and column returned more than source', function() {
    reset(true);
    res.source.respond('fine', 20, ['a', 'b', 'c']);
    res.destination.respond('fine', 40, ['a', 'b', 'c']);
    var check = res.check();
    assert(check === null, 'Bad response from check: ' + JSON.stringify(check))
  });
})
