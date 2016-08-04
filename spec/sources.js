var async = require('async');
var fs = require('fs');
var config = Object.assign({}, require('../config.json'));
var removeFileExtension = require('../bin/string-utilities').removeFileExtension;
var assert = require('chai').assert;
var outputFile = require('../bin/output-file');
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
            var source = require('../bin/src/' + testing);
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
              table: 'source_' + testing,
              log: require('../bin/log-test')(),
              source: testing
            };

            async.waterfall([
              function(cb) {
                mkdirp(opt.cfg.dirs.output, function(err) {
                  if (err) return cb(err);
                  assert(fs.existsSync(opt.cfg.dirs.output), 'Output folder not created. ' + opt.cfg.dirs.output);
                  cb(null);
                });
              },
              function(cb) {
                outputFile(opt, function(err, opfile) {
                  if (err) return cb(err);
                  opt.opfile = opfile;
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
              assert(rows == 2, '2 rows were not returned. Rows returned: ' + rows);
              assert(cs[0] == 'ONE' && cs[1] == 'TWO' && cs[2] == 'THREE' && cs[3] == 'FOUR', 'Column names did not match. Source returned: ' + cs.toString());
              done();
            });
          });
        });
      });
    });
  });
});
