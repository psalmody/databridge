var async = require('async');
var config = Object.assign({}, require('../config.json'));
config.TESTING = true;
var outputFile = require('../bin/output-file');
var opt = {
  cfg: config,
  table: 'MOCK_DATA'
};
var destinations = require('../bin/list-dest')(config);
var colParser = require('../bin/col-parser');
var columns;
var Timer = require('../bin/timer');
var fs = require('fs');
opt.log = require('../bin/log-test')(Object.assign({}, config, opt));
opt.timer = new Timer();
opt.source = 'DB_TEST';
config.logto = 'test';
var response = require('../bin/response')(Object.assign({}, config, opt));

describe('Run all destinations with MOCK_DATA', function() {
  it('Overrides opfile without error', function(done) {
    outputFile(opt, function(err, op) {
      opt.opfile = op;
      //force to use MOCK_DATA as output-ed data
      opt.opfile.filename = __dirname.replace(/\\/g, '/') + '/assets/MOCK_DATA.txt';
      opt.opfile.twoLines(function(err, data) {
        if (err) return done(err);
        var test2Lines = [
          'id_IND\tfirst_name\tlast_name\temail\tgender\tip_address\ttesting_GPA\ttesting_DATE\ttesting_TIMESTAMP\ttesting_DEC',
          '1\tEmily\tFisher\tefisher0@google.de\tFemale\t161.31.81.163\t89.64\t11/15/2015\t1/29/2016\t89.62'
        ];
        if (data[0] !== test2Lines[0] || data[1] !== test2Lines[1]) return done(new Error('Data returned by opfile.twoLines() did not match MOCK_DATA.\n' + data.toString() + test2Lines.toString()));
        done();
      });
    });
  });
  it('Parsed columns without error', function(done) {
    colParser(opt.opfile, function(err, parsedCols) {
      if (err) return done(err);
      columns = parsedCols;
      var cols = ['id', 'first_name', 'last_name', 'email', 'gender', 'ip_address', 'testing_GPA', 'testing_DATE', 'testing_TIMESTAMP', 'testing_DEC'];
      response.source.respond('ok', 1000, cols);
      done();
    });
  });
  it('Runs every destination', function() {
    async.each(destinations, function(dest) {
      describe('Checking ' + dest, function() {
        this.timeout(30000);
        var destination = fs.existsSync('./bin/dest/' + dest + '.js') ? require('../bin/dest/' + dest) : require(config.dirs.destinations + dest);
        it('Ran destination ' + dest, function(done) {
          destination(opt, columns, function(err, rows, columns) {
            if (err) return done(new Error(err));
            response.destination.respond('ok', rows, columns);
            var res = response.check();
            if (res === null) return done();
            done(new Error(res));
          });
        });
      });
    });
  });
});
