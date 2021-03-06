var async = require('async');
var fs = require('fs');
var config = Object.assign({}, require('../config.json'));
config.TESTING = true;
var removeFileExtension = require('../bin/string-utilities').removeFileExtension;
var assert = require('chai').assert;
var OutputFile = require('../bin/output-file');
var mkdirp = require('mkdirp');

config.logto = 'test';

// all sources
describe('Testing all sources', function() {
  var sources = require('../bin/list-src')(config);

  it('found some', function() {
    assert(sources.length !== 0, JSON.stringify(sources));
  });

  describe('Checking them now', function() {
    it('Sets them up', function() {
      async.each(sources, function(file) {
        describe('Checking source ' + file, function() {
          //at least 30 seconds
          this.timeout(30000);

          it('Should run a bridge', function(done) {
            var testing = removeFileExtension(file);
            var source = fs.existsSync('./bin/src/' + testing + '.js') ? require('../bin/src/' + testing) : require(config.dirs.sources + testing);
            var table = (testing == 'mongo') ? 'databridge.MOCK_DATA' : 'source_' + testing;
            var dirname = __dirname.replace(/\\/g, '/');
            var opt = {
              cfg: {
                dirs: {
                  output: dirname + '/assets/',
                  input: dirname + '/assets/',
                  creds: config.dirs.creds
                }
              },
              bin: dirname + '/../bin/',
              table: table,
              log: require('../bin/log-test')(),
              source: testing
            }
            opt.opfile = new OutputFile(opt)

            async.waterfall([
              function(cb) {
                mkdirp(opt.cfg.dirs.output, function(err) {
                  if (err) return cb(err);
                  assert(fs.existsSync(opt.cfg.dirs.output), 'Output folder not created. ' + opt.cfg.dirs.output);
                  cb(null);
                });
              },
              function(cb) {
                source(opt, function(err, rows, cs) {
                  if (err) return cb(err);
                  cb(null, rows, cs);
                });
              }
            ], function(err, rows, cs) {
              try {
                opt.opfile.clean();
              } catch (e) {
                return done(e);
              }
              if (err) return done(new Error(err));
              if (testing == 'mongo') {
                assert(rows == 1000, '1000 rows were not returned. Rows returned: ' + rows);
                assert(cs.join('') == 'idfirst_namelast_nameemailgenderip_addresstesting_GPAtesting_DATEtesting_TIMESTAMPtesting', 'Column names did not match. Source returned: ' + cs.toString());
              } else {
                assert(rows == 2, '2 rows were not returned. Rows returned: ' + rows);
                assert(cs[0] == 'ONE' && cs[1] == 'TWO' && cs[2] == 'THREE' && cs[3] == 'FOUR', 'Column names did not match. Source returned: ' + cs.toString());
              }
              done();
            });
          });
        });
      });
    });
  });
});
