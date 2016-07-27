/**
 * Cleanup logs and output folder - prompt user for number of days
 */


module.exports = function(opt, moduleCallback) {

  var fs = require('fs'),
    async = require('async'),
    rimraf = require('rimraf'),
    dirCount = 0,
    opCount = 0;

  async.waterfall([
      function(cb) {
        //delete logs younger than specified days
        fs.readdir(opt.dirs.logs, function(err, files) {
          if (err) return cb(err);
          for (var i = 0; i < files.length; i++) {
            if (files[i] == '.gitignore') continue;
            var dt = new Date(),
              dtdir = dt.getFullYear() + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + ('0' + dt.getDate()).slice(-2);
            if ((Number(dtdir) - Number(opt.days)) >= Number(files[i].replace(/-/g, ''))) {
              dirCount++;
              try {
                rimraf.sync(opt.dirs.logs + files[i]);
              } catch (e) {
                cb(e);
              }
            }
          }
          cb(null);
        });
      },
      function(cb) {
        //delete any extra output files
        fs.readdir(opt.dirs.output, function(err, files) {
          if (err) return cb(err);
          for (var i = 0; i < files.length; i++) {
            if (files[i] == '.gitignore') continue;
            opCount++;
            try {
              rimraf.sync(opt.dirs.output + files[i]);
            } catch (e) {
              cb(e);
            }
          }
          cb(null);
        });
      }
    ],
    function(err) {
      if (err) return moduleCallback(err);
      if (typeof(moduleCallback) === 'function') moduleCallback(null, 'Deleted ' + dirCount + ' log directories that were older than ' + opt.days + ' days and ' + opCount + ' leftover output files.');
    });
};
