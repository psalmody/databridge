var async = require('async');
var bridge = require('../bin/bridge');
var fs = require('fs');
var config = Object.assign({}, require('../config.json'));
var removeFileExtension = require('../bin/string-utilities').removeFileExtension;
var assert = require('chai').assert;

function getOneTable(src) {
  var dir = fs.readdirSync(config.dirs.input + src);
  var tables = dir.filter(function(v) {
    if (v.indexOf('.') == 0) return false;
    return true;
  });
  return removeFileExtension(tables[0]);
}

config.logto = 'test';

//if --one= passed, only test one
if (process.argv.join(' ').indexOf('--one=') !== -1) {
  var source = process.argv.join(' ').split('--one=')[1].split(' ')[0].replace(/-/g, '');
  describe('Checking only one source: ' + source, function() {
    this.timeout(30000);

    var table = getOneTable(source);

    it('Should run a bridge', function(done) {
      bridge(config, {
        source: source,
        destination: 'csv',
        binds: true,
        task: true,
        update: false,
        table: table
      }, function(err) {
        if (err) return done(new Error(err.toString()));
        done();
      });
    });
  });
} else {
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

            //remove file extension
            var source = removeFileExtension(file);

            var table = getOneTable(source);

            it('Should run a bridge', function(done) {
              bridge(config, {
                source: source,
                destination: 'csv',
                binds: true,
                task: true,
                update: false,
                table: table
              }, function(err) {
                if (err) return done(new Error(err.toString()));
                done();
              });
            });
          });
        });
      });
    });
  });
}
