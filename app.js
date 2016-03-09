var timer = require('./bin/timer'),
  args = process.argv,
  async = require('async'),
  log = console.log,
  error = console.error,
  fs = require('fs');

if (args.length < 6) return console.error('Incorrect usage. Try: \n   npm start <source> to <destination> <query filename>');

var processor = require('./bin/' + args[2] + '2' + args[4]), //processor is based on arguments
  file = args[2] == 'csv' ? args[5] + '.csv' : args[5] + '.sql', //file is in querys if not from csv source
  dir = args[2] == 'csv' ? './csv/' : './querys/';

async.waterfall([
  function(cb) {
    //check file exists
    fs.stat(dir + file, function(err, stats) {
      if (err) return cb(err);
      log('Found query ' + file);
      cb(null);
    })
  },
  function(cb) {
    //process
    processor(file, function(err) {
      if (err) return cb(err);
      cb(null);
    })
  },
  function(cb) {
    //cleanup tmp folder
    fs.readdir('./tmp/', function(err, files) {
      if (err) return cb(err);
      files.splice(files.indexOf('.gitignore'), 1);
      cb(null, files);
    })
  },
  function(files, cb) {
    if (!files.length) return cb(null);
    for (var i = 0; i < files.length; i++) {
      var filePath = './tmp/' + files[i];
      fs.unlinkSync(filePath);
    }
  }
], function(err) {
  if (err) {
    error(timer.now.str());
    return error(err);
  }
  log(timer.now.str());
  log('Completed');
})
