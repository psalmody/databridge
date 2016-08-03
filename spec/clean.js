var assert = require('chai').assert,
  fs = require('fs'),
  mkdirp = require('mkdirp'),
  config = Object.assign({}, require('../config.json')),
  clean = require('../bin/clean');

var dt = new Date(),
  dtdir = dt.getFullYear() + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + ('0' + dt.getDate()).slice(-2);

var logDir = config.dirs.logs + dtdir + '/';
var outputDir = config.dirs.output;

var dirs = [
  logDir + 'test',
  outputDir + 'csv/1234-11-12'
];

var logs = [
  logDir + 'test.log.txt',
  dirs[0] + '/test.log.txt'
];

var outputs = [
  outputDir + 'test.dat',
  dirs[1] + '/test.csv'
];

describe('Creating temp dirs', function() {
  dirs.forEach(function(dir) {
    it('created dir ' + dir, function(done) {
      mkdirp(dir, function(err) {
        if (err) return done(err);
        done();
      });
    });
  });
});

describe('Creating temp logs', function() {
  logs.forEach(function(log) {
    it('Created log ' + log, function(done) {
      var file = log;
      fs.closeSync(fs.openSync(file, 'w'));
      var f = fs.statSync(file);
      assert(f.isFile());
      done();
    });
  });
});

describe('Creating temp output files', function() {
  outputs.forEach(function(log) {
    it('Created temp outputs ' + log, function(done) {
      fs.closeSync(fs.openSync(log, 'w'));
      var f = fs.statSync(log);
      assert(f.isFile());
      done();
    });
  });
});

describe('Trying to clean files', function() {
  it('Cleaned files without error.', function(done) {
    clean({
      days: 0,
      dirs: config.dirs
    }, function(err, res) {
      if (err) return done(err);
      console.log(res);
      done();
    });
  });
});

describe('They are actually gone', function() {
  logs.forEach(function(log) {
    it('Deleted log ' + log, function(done) {
      try {
        var f = fs.statSync(log);
        if (f.isFile()) return done(new Error(log + ' not deleted.'));
      } catch (e) {
        done();
      }
    });
  });

  outputs.forEach(function(file) {
    it('Deleted file ' + file, function(done) {
      try {
        var f = fs.statSync(file);
        if (f.isFile()) return done(new Error(file + ' not deleted.'));
      } catch (e) {
        done();
      }
    });
  });
});
