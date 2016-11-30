var assert = require('chai').assert,
  fs = require('fs'),
  config = Object.assign({}, require('../config.json')),
  async = require('async');

var removeFileExtension = require('../bin/string-utilities').removeFileExtension;

var localSources = fs.readdirSync(config.dirs.sources).filter(function(f) {
  return f.indexOf('.') !== 0;
});
var localDestinations = fs.readdirSync(config.dirs.destinations).filter(function(f) {
  return f.indexOf('.') !== 0;
});
var batches = fs.readdirSync(config.dirs.batches).filter(function(f) {
  return f.indexOf('.') !== 0;
});

//don't throw errors if there are no batches setup
if (batches.length != 0) {

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

            var destination = fs.existsSync('./bin/dest/' + bridge.destination + '.js') ? require('../bin/dest/' + bridge.destination) : require(config.dirs.destinations + bridge.destination);
            if (!(destination instanceof Function)) {
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

            var source = fs.existsSync('./bin/src/' + bridge.source + '.js') ? require('../bin/src/' + bridge.source) : require(config.dirs.sources + bridge.source);
            if (!(source instanceof Function))
              ok = false;
            bad = bridge;
            badIndex = index + ' source not installed';
            return false;
          }


          return true;
        });

        assert(ok, 'Failed on item ' + badIndex + ':\n' + JSON.stringify(bad, null, 2));
        done();
      });

    });
  });
}
