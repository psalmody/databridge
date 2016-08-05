var fs = require('fs');
var logFile = require('../bin/log-file');
var async = require('async');
var mkdirp = require('mkdirp');
var log;
var dirname = __dirname.replace(/\\/g, '/') + '/';
var assert = require('chai').assert;
var rimraf = require('rimraf');
var opt = {
  table: 'testing-log-file',
  cfg: {
    dirs: {
      logs: dirname + 'assets/'
    }
  }
};
var optBatch = Object.assign({
  batch: 'testing'
}, opt);
var dt = new Date();
var dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
var logFolder;
var expectLines = [
  '', //process env
  '', //timestamp
  ': Testing...',
  'Group: Testing...',
  'Error! Group: "Testing..."'
];

describe('Testing log-file', function() {
  it('Creates log file folder for batches.', function(done) {
    var testBatchLog = function() {
      var batchFolder = log.filename.split('/');
      batchFolder.pop();
      batchFolder = batchFolder.join('/');
      assert(fs.existsSync(batchFolder), 'Log batch folder does not exist. ' + batchFolder);
      assert(fs.existsSync(log.filename), 'Log file does not exist. ' + log.filename);
      var deleteFolder = opt.cfg.dirs.logs + batchFolder.split('/')[batchFolder.split('/').length - 2];
      rimraf(deleteFolder, function() {
        assert(fs.existsSync(log.filename) === false, 'Log file not cleaned up.');
        assert(fs.existsSync(batchFolder) === false, 'Log batch folder not cleaned up.');
        done();
      });
    };
    log = logFile(optBatch, testBatchLog);
  });
  it('Appends something to log file name if that log file exists.', function(done) {
    this.timeout(5000);
    //create "logs" for the next 20 seconds
    var start = Math.round(Date.now() / 1000);
    var logDir = opt.cfg.dirs.logs + dir + '/';
    var arr = Array(20).fill().map(function(x, i) {
      var t = i + start;
      return logDir + opt.table + '.' + t + '.log.txt';
    });
    mkdirp(logDir, function(err) {
      if (err) return done(new Error(err));
      async.each(arr, function(f, cb) {
        fs.appendFile(f, 'Created by tester.', function(e) {
          if (e) return cb(e);
          cb(null);
        });
      }, function(e) {
        if (e) return done(new Error(e));
        var testLog = function() {
          assert(arr.indexOf(log.filename) === -1, 'Filename in array of created files: ' + log.filename);
          assert(fs.existsSync(log.filename), 'Log file does not exist. ' + log.filename);
          assert(fs.readFileSync(log.filename, 'utf-8').indexOf('Created by tester.') === -1, 'File in log was created by tester.');
          done();
        };
        log = logFile(opt, testLog);
      });
    });
  });
  it('Creates log for non-batches.', function(done) {
    var testLog = function() {
      var folder = log.filename.split('/');
      folder.pop();
      logFolder = folder.join('/');
      assert(fs.existsSync(logFolder), 'Log folder does not exist: ' + logFolder);
      assert(fs.existsSync(log.filename), 'Log file does not exist. ' + log.filename);
      assert(logFolder === opt.cfg.dirs.logs + dir, 'Folder created wrong: Expected: ' + opt.cfg.dirs.logs + dir + ', got: ' + logFolder);
      done();
    };
    delete opt.batch;
    log = logFile(opt, testLog);
  });
  it('Logs, prepends group and error!.', function(done) {
    log.log('Testing...');
    log.group('Group').log('Testing...');
    log.error('Testing...');
    var lines = fs.readFileSync(log.filename, 'utf-8').split('\n');
    assert(lines[2] === expectLines[2], lines[2] + ' != ' + expectLines[2]);
    assert(lines[3] === expectLines[3], lines[3] + ' != ' + expectLines[3]);
    assert(lines[4] === expectLines[4], lines[4] + ' != ' + expectLines[4]);
    done();
  });
  it('Cleans up log folder and file', function(done) {
    rimraf(logFolder, function() {
      assert(fs.existsSync(log.filename) === false, 'Log file not cleaned up. ' + log.filename);
      assert(fs.existsSync(logFolder) === false, 'Log folder not cleaned up. ' + logFolder);
      done();
    });
  });
});
