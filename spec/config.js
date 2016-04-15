var assert = require('chai').assert,
  async = require('async'),
  fs = require('fs'),
  missingKeys = require('../bin/missing-keys');

//test for all necessasry configuration options
async.each(fs.readdirSync('./config/'), function(file, callback) {
  describe(file, function() {
    var cfg = require('../config/' + file);
    it("Should have batches, connections, destinations, input, logs, output, sources", function(done) {
      var msg = missingKeys(cfg.dirs, ['batches', 'connections', 'destinations', 'input', 'logs', 'output', 'sources']);
      if (!msg) {
        assert(true);
        return done();
      }
      assert(false, 'Missing: ' + msg);
      done();
    })
  })
})
