var assert = require('chai').assert,
  fs = require('fs'),
  config = require('../config.json'),
  async = require('async'),
  bridge = require('../bin/bridge'),
  parseBatch = require('../bin/batch-parse'),
  runBridges = require('../bin/bridge-runner');

var removeFileExtension = require('../bin/string-utilities').removeFileExtension;

var localSources = fs.readdirSync(config.dirs.sources);
var localDestinations = fs.readdirSync(config.dirs.destinations);
var batches = fs.readdirSync(config.dirs.batches);

//first test batches for required settings
//and existing localSources/localDestinations/tables
async.each(fs.readdirSync(config.dirs.batches), function(file, callback) {
  var batch = removeFileExtension(file);
  describe('Checking batch ' + batch, function() {
    it('Contains source and destination and those localSources/localDestinations exist.', function(done) {
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
            badIndex = index + ' destination does not exist';
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
            badIndex = index + ' source does not exist';
            return false;
          }
        }

        return true;
      });

      assert(ok, 'Failed on item ' + badIndex + ':\n' + JSON.stringify(bad, null, 2));
      done();
    })

  })
})


if (process.argv.join(' ').indexOf('--no-run') !== -1) {
  return;
}


//then run one batch
var batch = batches[batches.length - 1];
var batchSettings = require(config.dirs.batches + batch);
describe('Running last batch in directory: ' + batch, function() {
  //this could take a couple of minutes at least
  this.timeout(120000);
  var bridges = parseBatch('testBatch', config.dirs.batches + batch);
  it('Generates same number of bridges as batch settings.', function(done) {
    assert(batchSettings.length == bridges.length, 'Length of batches and generated bridges does not match. Batches: ' + batchSettings.length + ', bridges: ' + bridges.length);
    done();
  })

  it('Runs the batch without error.', function(done) {
    var runBridges = require('../bin/bridge-runner');
    runBridges(bridges, function(err, responses) {
      if (err) return done(err);
      done();
    })
  })
})
