var assert = require('chai').assert,
  async = require('async');

var bridge = require('../bin/bridge');
var fs = require('fs');
var config = require('../config/development');

function removeFileExtension(str) {
  var s = str.split('.');
  s.pop();
  return s.join('.');
}

async.each(fs.readdirSync(config.dirs.sources), function(file, callback) {
  describe('Checking source ' + file, function() {
    //at least 30 seconds
    this.timeout(30000);

    //remove file extension
    var source = removeFileExtension(file);

    //change to production
    process.env.NODE_ENV = "production";

    //which table?
    var tableDir = fs.readdirSync(config.dirs.input + source);
    var tables = tableDir.filter(function(value) {
      if (value.indexOf('.') == 0) return false;
      return true;
    });
    //console.log(file, tables);
    var table = removeFileExtension(tables[0]);
    //console.log(table);

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
          console.log(err);
          assert(false);
          done();
        } else {
          assert(true);
          done();
        }
      })
    })

  });


})
