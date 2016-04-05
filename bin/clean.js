/**
 * Cleanup logs and output folder - prompt user for number of days
 */
var fs = require('graceful-fs'),
  async = require('async'),
  colors = require('colors/safe'),
  rimraf = require('rimraf'),
  program = require('commander'),
  DBUTIL,
  dirCount = 0,
  opCount = 0,
  days = 7;


async.waterfall([
    //read package.json
    function(cb) {
      fs.readFile('package.json', 'utf-8', function(err, data) {
        DBUTIL = JSON.parse(data);
        cb(null);
      })
    },
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
      fs.readdir('logs/', function(err, files) {
        if (err) return cb(err);
        for (var i = 0; i < files.length; i++) {
          if (files[i] == '.gitignore') continue;
          var dt = new Date(),
            tddir = dt.getFullYear() + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + ('0' + dt.getDate()).slice(-2);
          if ((Number(tddir) - Number(days)) >= Number(files[i].replace(/-/g, ''))) {
            dirCount++;
            try {
              rimraf.sync('logs/' + files[i])
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
      fs.readdir('output/', function(err, files) {
        if (err) return cb(err);
        for (var i = 0; i < files.length; i++) {
          if (files[i] == '.gitignore') continue;
          opCount++;
          fs.unlink('output/' + files[i]);
        }
        cb(null);
      })
    }
  ],
  function(err) {
    if (err) return console.log(colors.red(err));
    console.log('Deleted ' + dirCount + ' log directories that were older than ' + days + ' days and ' + opCount + ' leftover output files.');
  })
