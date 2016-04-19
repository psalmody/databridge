/**
 * Cleanup logs and output folder - prompt user for number of days
 */

//assume we're in development
process.env.NODE_ENV = typeof(process.env.NODE_ENV) == 'undefined' ? 'development' : process.env.NODE_ENV;

var fs = require('fs'),
  async = require('async'),
  colors = require('colors/safe'),
  rimraf = require('rimraf'),
  program = require('commander'),
  config = require('../config/' + process.env.NODE_ENV),
  DBUTIL = require('../package'),
  dirCount = 0,
  opCount = 0,
  days = 7;


async.waterfall([
    //setup commander
    function(cb) {
      program.version(DBUTIL.version)
        .usage('[options] <keywords>')
        .option('-d, --days [n]', 'Keep logs/output files older than <n> days. Use 0 to delete all. Default is 7 days.', parseInt)
        .parse(process.argv);
      days = typeof(program.days) == 'undefined' ? days : program.days;
      cb(null);
    },
    function(cb) {
      //delete logs younger than specified days
      fs.readdir(config.dirs.logs, function(err, files) {
        if (err) return cb(err);
        for (var i = 0; i < files.length; i++) {
          if (files[i] == '.gitignore') continue;
          var dt = new Date(),
            tddir = dt.getFullYear() + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + ('0' + dt.getDate()).slice(-2);
          if ((Number(tddir) - Number(days)) >= Number(files[i].replace(/-/g, ''))) {
            dirCount++;
            try {
              rimraf.sync(config.dirs.logs + files[i])
            } catch (e) {
              cb(e);
            };
          }
        }
        cb(null);
      })
    },
    function(cb) {
      //delete any extra output files
      fs.readdir(config.dirs.output, function(err, files) {
        if (err) return cb(err);
        for (var i = 0; i < files.length; i++) {
          if (files[i] == '.gitignore') continue;
          opCount++;
          try {
            rimraf.sync(config.dirs.output + files[i])
          } catch (e) {
            cb(e);
          }
        }
        cb(null);
      })
    }
  ],
  function(err) {
    if (err) return console.log(colors.red(err));
    console.log('Deleted ' + dirCount + ' log directories that were older than ' + days + ' days and ' + opCount + ' leftover output files.');
  })
