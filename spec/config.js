var assert = require('chai').assert,
  fs = require('fs'),
  missingKeys = require('../bin/missing-keys'),
  async = require('async');

//test for all necessary configuration options
describe('Testing ../config.json', function() {
  var cfg = require('../config.json');
  var dirs = ['batches', 'creds', 'destinations', 'input', 'logs', 'output', 'sources'];

  it("Should have batches, creds, destinations, input, logs, output, sources", function(done) {
    var msg = missingKeys(cfg.dirs, dirs);
    if (!msg) {
      assert(true);
      return done();
    }
    assert(false, 'Missing: ' + msg.join(', '));
    done();
  });

  it('Those folders in config should exist', function() {
    dirs.forEach(function(d) {
      assert(fs.lstatSync(cfg.dirs[d]).isDirectory(),'Not a directory or not exists: '+cfg.dirs[d]);
    });
  })

  it("Should have some default bind variables", function(done) {
    assert(typeof(cfg.defaultBindVars) == 'undefined' ? false : true, typeof(cfg.defaultBindVars));
    done();
  });

  it('Should have logto option', function(done) {
    assert(typeof(cfg.logto) == 'undefined' ? false : true, typeof(cfg.logto));
    done();
  });

  it('If schedule defined, file exists', function() {
    if (typeof(cfg.schedule) == 'undefined') return assert(true);
    assert(fs.lstatSync(cfg.schedule).isFile(), 'Not a file '+cfg.schedule);
  });

  it('If schedule defined, config has service and service has name and valid log filename.', function() {
    if (typeof(cfg.schedule) == 'undefined') return assert(true);
    if (typeof(cfg.service) == 'undefined') return assert(false, 'No service attribute in config.');
    if (typeof(cfg.service.name) !== 'string') return assert(false, 'service.name not exists or is not string');
    var logdir = cfg.service.log.split('/').slice(0, -1).join('/');
    assert(fs.lstatSync(logdir).isDirectory(), 'Not a file '+cfg.service.log);
  })

});
