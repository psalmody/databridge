var assert = require('chai').assert,
  fs = require('fs'),
  config = Object.assign({}, require('../config.json')),
  async = require('async');

var removeFileExtension = require('../bin/string-utilities').removeFileExtension;

var localSources = fs.readdirSync(config.dirs.sources);
var localDestinations = fs.readdirSync(config.dirs.destinations);
var batches = fs.readdirSync(config.dirs.batches);

//first test batches for required settings
//and existing localSources/localDestinations/tables
async.each(batches, function(file) {
  var batch = removeFileExtension(file);
  describe('Checking batch ' + batch, function() {
    it('Contains source and destination and those localSources/localDestinations are installed.', function(done) {
      var batchSettings = require(config.dirs.batches + batch);
      var ok = true;
      var bad;
      var badIndex;
      batchSettings.every(function(bridge, index) {
        //if not a string, bad
        if (typeof(bridge.destination) !== 'string') {
          ok = false;
          bad = bridge;
          badIndex = index;
          return false;
        }
        //check destination exists
        if (localDestinations.indexOf(bridge.destination + '.js') == -1) {
          //if no local, try requiring
          try {
            require('databridge-destination-' + bridge.destination);
          } catch (e) {
            ok = false;
            bad = bridge;
            badIndex = index + ' destination not installed';
            return false;
          }
        }
        //if not a string, bad
        if (typeof(bridge.source) !== 'string') {
          ok = false;
          bad = bridge;
          badIndex = index;
          return false;
        }
        //check source exists
        if (localSources.indexOf(bridge.source + '.js') == -1) {
          //if no local, try requiring
          try {
            require('databridge-source-' + bridge.source);
          } catch (e) {
            ok = false;
            bad = bridge;
            badIndex = index + ' source not installed';
            return false;
          }
        }

        return true;
      });

      assert(ok, 'Failed on item ' + badIndex + ':\n' + JSON.stringify(bad, null, 2));
      done();
    });

  });
});
