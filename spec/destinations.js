var assert = require('chai').assert,
  async = require('async');

var bridge = require('../bin/bridge');
var fs = require('fs');
var config = require('../config.json');

//change to file log for cleaner output
config.logto = 'file';

var removeFileExtension = require('../bin/string-utilities').removeFileExtension;
var npmls = require('../bin/npm-ls');

function getOneTable(src) {
  var dir = fs.readdirSync(config.dirs.input + src);
  var tables = dir.filter(function(v) {
    if (v.indexOf('.') == 0) return false;
    return true;
  });
  return removeFileExtension(tables[0]);
}

//if --destination passed, only test one
//if --one= passed, only test one
if (process.argv.join(' ').indexOf('--one=') !== -1) {
  var destination = process.argv.join(' ').split('--one=')[1].split(' ')[0].replace(/-/g, '');
  describe('Checking only one destination: ' + destination, function() {
    this.timeout(30000);

    var table = getOneTable('mssql');

    it("Should run a bridge", function(done) {
      bridge(config, {
        source: 'mssql',
        destination: destination,
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
  //quit
  return;
};

//all destinations


describe('Testing all destinations', function() {
  var destinations = [];

  beforeEach(function(done) {
    this.timeout(5000);
    npmls(function(err, pkgs) {
      if (err) return console.error(err);
      var dests = fs.readdirSync(config.dirs.destinations).filter(function(v) {
        return v.indexOf('.') !== 0;
      });
      var keys = Object.keys(pkgs.dependencies);
      keys.forEach(function(k) {
        if (k.indexOf('databridge-destination-') !== -1)
          dests.push(k.split('databridge-destination-')[1]);
      })
      destinations = dests;
      done();
    });
  });

  it('found some', function() {
    assert(destinations.length !== 0, JSON.stringify(destinations));
  });

  describe('Checking them now ', function() {
    it('Sets them up', function() {
      async.each(destinations, function(file, callback) {
        describe('Checking destination ' + file, function() {
          //at least 30 seconds
          this.timeout(30000);

          //remove file extension
          var destination = removeFileExtension(file);

          //which table?
          var tableDir = fs.readdirSync(config.dirs.input + 'mssql');
          var tables = tableDir.filter(function(value) {
            if (value.indexOf('.') == 0) return false;
            return true;
          });

          var table = removeFileExtension(tables[0]);

          it("Should run a bridge", function(done) {
            var options = {
              source: 'mssql',
              destination: destination,
              binds: true,
              task: true,
              update: false,
              table: table
            };
            bridge(config, options, function(err, response) {
              if (err) return done(new Error(err.toString()));
              done();
            });
          });
        });

      }, function(err) {
        if (err) return assert(err);
      });
    });
  });
});
