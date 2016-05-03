var assert = require('chai').assert,
  bindQuery = require('../../bin/bind-query'),
  config = require('../../config/development'),
  Spinner = require('cli-spinner').Spinner,
  spinner = new Spinner('processing... %s');

//override spinner.start()
spinner.start = function() {
  return;
};

//sql expectations
var sql = "/* testing */ \n --test \n SELECT * --test \n FROM test_table \n WHERE column = '101' AND column_two = :bind_variable_one --test\nand column_three = :bind_variable_two\n/*test test */\nAND column_four = :bind_variable_three /* test */";
var shouldbesql = " \n  SELECT *  FROM test_table \n WHERE column = '101' AND column_two = uno and column_three = 2\n\nAND column_four = three ";
var noBindsSql = shouldbesql;

var opt = {
  cfg: config,
  spinner: spinner,
  binds: {
    "bind_variable_one": "uno",
    "bind_variable_two": 2,
    "bind_variable_three": "three"
  }
};

var opt2 = {
  cfg: config,
  spinner: spinner,
  binds: {
    "bind_variable_one": "uno",
    "bind_variable_three": "three"
  }
};

var opt3 = {
  cfg: config,
  spinner: spinner
}

describe('Testing bind-query', function() {
  describe('Testing using predefined bind variables.', function() {
    bindQuery(sql, opt, function(err, newsql, defBinds) {
      if (err) return assert(false, err);
      it('Removes all comments', function() {
        assert(newsql.indexOf('/* test */') == -1, 'Found a comment /* test */ in ' + newsql);
        assert(newsql.indexOf('--test') == -1, 'Found a comment --test in ' + newsql);
      });
      it('binds variables from option object', function() {
        assert(newsql == shouldbesql, "Bound sql doesn't match " + shouldbesql + "\nInstead it's:\n" + newsql);
      });
    })
  });
  describe('Testing using prompted variables use defaults and bind_variable_two = 2 within 10 seconds.', function() {
    it('Prompts for unfound variables and gives possible default values.', function(done) {
      this.timeout(10000);
      bindQuery(sql, opt2, function(err, newsql, defBinds) {
        if (err) return assert(false, err);
        assert(newsql == shouldbesql, "Bound sql doesn't match " + shouldbesql + "\nInstead it's:\n" + newsql)
        done();
      })
    })
  });
  describe("testing using ALL prompted variables no defaults. Enter uno, 2, three within 10 seconds.", function() {
    it('Prompts for variables when none have been provided.', function(done) {
      this.timeout(10000);
      bindQuery(sql, opt3, function(err, newsql, defBinds) {
        if (err) return assert(false, err);
        assert(newsql == shouldbesql, "Bound sql doesn't match " + shouldbesql + "\nInstead it's:\n" + newsql)
        done();
      })
    })
  });
  describe('testing using a query with no bind variables and no binds in opt.', function() {
    it('Does not prompt and returns the correct query with no error.', function(done) {
      this.timeout(10000);
      bindQuery(noBindsSql, opt3, function(err, newsql, defBinds) {
        if (err) return assert(false, err);
        assert(newsql == noBindsSql, "SQL does not match " + noBindsSql + "\nInstead it's:\n" + newsql);
        done();
      })
    })
  });
  describe('testing using a query with no bind vars and binds ARE in opt', function() {
    it('Does not prompt and returns the correct query with no error.', function(done) {
      this.timeout(10000);
      bindQuery(noBindsSql, opt, function(err, newsql, defBinds) {
        if (err) return assert(false, err);
        assert(newsql == noBindsSql, "SQL does not match " + noBindsSql + "\nInstead it's:\n" + newsql);
        done();
      })
    })
  })
})
