var async = require('async');

var bridge = require('../bin/bridge');
var fs = require('fs');
var config = require('../config/development');
//change to file log for cleaner test output
config.logto = 'file';

var removeFileExtension = require('../bin/string-utilities').removeFileExtension;
var npmls = require('../bin/npm-ls');
var assert = require('chai').assert;

function getOneTable(src) {
  var dir = fs.readdirSync(config.dirs.input + src);
  var tables = dir.filter(function(v) {
    if (v.indexOf('.') == 0) return false;
    return true;
  });
  return removeFileExtension(tables[0]);
}


//if --one= passed, only test one
if (process.argv.join(' ').indexOf('--one=') !== -1) {
  var source = process.argv.join(' ').split('--one=')[1].split(' ')[0].replace(/-/g, '');
  describe('Checking only one source: ' + source, function() {
    this.timeout(30000);

    var table = getOneTable(source);

    it("Should run a bridge", function(done) {
      bridge(config, {
        source: source,
        destination: 'mssql',
        binds: true,
        task: true,
        update: false,
        table: table
      }, function(err, response) {
        if (err) return done(new Error(err.toString()));
        done();
      })
    })
  });
  //quit
  return;
}


// all sources
describe('Testing all sources', function() {
  var sources = [];
  beforeEach(function(done) {
    this.timeout(5000);
    npmls(function(err, pkgs) {
      if (err) return console.error(err);
      var srcs = fs.readdirSync(config.dirs.sources).filter(function(v) {
        return v.indexOf('.') !== 0;
      });
      var keys = Object.keys(pkgs.dependencies);
      keys.forEach(function(k) {
        if (k.indexOf('databridge-source-') !== -1)
          srcs.push(k.split('databridge-source-')[1]);
      })
      sources = srcs;
      done();
    });
  });

  it('found some', function() {
    assert(sources.length !== 0, JSON.stringify(sources));
  });

  describe('Checking them now', function() {
    it('Sets them up', function() {
      async.each(sources, function(file, callback) {
        describe('Checking source ' + file, function() {
          //at least 30 seconds
          this.timeout(30000);

          //remove file extension
          var source = removeFileExtension(file);

          var table = getOneTable(source);

          it("Should run a bridge", function(done) {
            bridge(config, {
              source: source,
              destination: 'mssql',
              binds: true,
              task: true,
              update: false,
              table: table
            }, function(err, response) {
              if (err) return done(new Error(err.toString()));
              done();
            });
          });
        });
      });
    });
  });
});
