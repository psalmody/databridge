var fs = require('fs'),
  prompt = require('prompt'),
  async = require('async'),
  colors = require('colors/safe'),
  findRemoveSync = require('find-remove');

prompt.start();
prompt.message = '';
prompt.delimiter = colors.green(':');

async.waterfall([
  function(cb) {
    prompt.get({
      properties: {
        days: {
          default: 10,
          description: colors.green('Keep logs younger than (days)')
        }
      }
    }, function(err, result) {
      cb(null, result);
    })
  },
  function(result, cb) {
    console.log(findRemoveSync('logs', {
      ignore: '.gitignore',
      age: {
        seconds: result.days
      }
    }))
    cb(null);
  }
], function(err) {
  if (err) return console.log(colors.red(err));
})
