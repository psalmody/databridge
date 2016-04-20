var assert = require('chai').assert,
  async = require('async');

var bridge = require('../bin/bridge');
var fs = require('fs');
var config = require('../config/development');
var removeFileExtension = require('../bin/string-utilities').removeFileExtension;

function getOneTable(src) {
  var dir = fs.readdirSync(config.dirs.input + src);
  var tables = dir.filter(function(v) {
    if (v.indexOf('.') == 0) return false;
    return true;
  });
  return removeFileExtension(tables[0]);
}


//if --source passed, only test one
if (process.argv.length == 4) {
  var source = process.argv[3].replace(/-/g, '');
  describe('Checking only one source: ' + source, function() {
    this.timeout(30000);
    process.env.NODE_ENV = "production";

    var table = getOneTable(source);

    it("Should run a bridge", function(done) {
      bridge(config, {
        source: source,
        destination: 'mssql',
        binds: true,
        task: true,
        update: false,
        table: table
      }, function(err) {
        if (err) {
          assert(false, err);
          done();
        } else {
          assert(true);
          done();
        }
      })
    })
  });
  //quit
  return;
}


// all sources
async.each(fs.readdirSync(config.dirs.sources), function(file, callback) {
  describe('Checking source ' + file, function() {
    //at least 30 seconds
    this.timeout(30000);

    //remove file extension
    var source = removeFileExtension(file);

    //change to production
    process.env.NODE_ENV = "production";

    var table = getOneTable(source);

    it("Should run a bridge", function(done) {
      bridge(config, {
        source: source,
        destination: 'mssql',
        binds: true,
        task: true,
        update: false,
        table: table
      }, function(err) {
        if (err) {
          assert(false, err);
          done();
        } else {
          assert(true);
          done();
        }
      });
    });
  });
});
