var assert = require('chai').assert,
  fs = require('fs'),
  missingKeys = require('../bin/missing-keys'),
  async = require('async');

//test for all necessasry configuration options
async.each(fs.readdirSync('./config/'), function(file, callback) {
  describe(file, function() {
    var cfg = require('../config/' + file);
    it("Should have batches, creds, destinations, input, logs, output, sources", function(done) {
      var msg = missingKeys(cfg.dirs, ['batches', 'creds', 'destinations', 'input', 'logs', 'output', 'sources']);
      if (!msg) {
        assert(true);
        return done();
      }
      assert(false, 'Missing: ' + msg.join(', '));
      done();
    });

    it("Should have some default bind variables", function(done) {
      assert(typeof(cfg.defaultBindVars) == 'undefined' ? false : true, typeof(cfg.defaultBindVars));
      done();
    })
  })
})
