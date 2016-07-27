var assert = require('chai').assert,
  fs = require('fs'),
  missingKeys = require('../bin/missing-keys'),
  async = require('async');

//test for all necessary configuration options
describe('Testing config.json', function() {
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
      assert(fs.lstatSync(cfg.dirs[d]).isDirectory(), 'Not a directory or not exists: ' + cfg.dirs[d]);
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
    assert(fs.lstatSync(cfg.schedule).isFile(), 'Not a file ' + cfg.schedule);
  });

  it('If schedule defined, pm2 config has valid log filename.', function() {
    if (typeof(cfg.schedule) == 'undefined') return assert(true);
    try {
      var pm2cfg = require('../pm2.json');
    } catch(e) {
      assert(false,'Couldn\'t find file pm2.json. '+e.toString())
    }
    var p = pm2cfg.apps[0];
    var logdir = p.out_file.split('/').slice(0, -1).join('/');
    var errordir = p.error_file.split('/').slice(0, -1).join('/');
    assert(fs.lstatSync(logdir).isDirectory(), 'Log directory doesn\'t exist, bad log value in pm2.json ' + p.out_file);
    assert(fs.lstatSync(errordir).isDirectory(), 'Error log directory doesn\'t exist, bad error log value in pm2.json ' + p.error_file);
  })

});
