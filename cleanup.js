var fs = require('fs'),
  prompt = require('prompt'),
  async = require('async'),
  colors = require('colors/safe'),
  rimraf = require('rimraf');

prompt.start();
prompt.message = '';
prompt.delimiter = colors.green(':');

async.waterfall([
    function(cb) {
      prompt.get({
        properties: {
          days: {
            default: 7,
            description: colors.green('Keep logs younger than (days)')
          }
        }
      }, function(err, result) {
        cb(null, result);
      })
    },
    function(result, cb) {
      //delete logs younger than specified days
      fs.readdir('./logs/', function(err, files) {
        if (err) return cb(err);

        for (var i = 0; i < files.length; i++) {
          if (files[i] == '.gitignore') continue;
          var dt = new Date(),
            tddir = dt.getFullYear() + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + ('0' + dt.getDate()).slice(-2);
          if ((Number(tddir) - Number(result.days)) >= Number(files[i].replace(/-/g, ''))) rimraf.sync('./logs/' + files[i]);
        }
        cb(null);
      })
    },
    function(cb) {
      //delete any extra output files
      fs.readdir('./output/', function(err, files) {
        if (err) return cb(err);
        for (var i = 0; i < files.length; i++) {
          if (files[i] == '.gitignore') continue;
          fs.unlink('./output/' + files[i]);
        }
        cb(null);
      })
    }
  ],
  function(err) {
    if (err) return console.log(colors.red(err));
  })
