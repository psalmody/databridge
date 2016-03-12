var tmr = require('./bin/timer'),
  args = process.argv,
  async = require('async'),
  l = console.log,
  error = console.error,
  fs = require('fs'),
  colParser = require('./bin/colParser');

if (args.length < 6) return console.error('Incorrect usage. Try: \n   npm start <source> to <destination> <query filename>');

/*var processor = require('./bin/' + args[2] + '2' + args[4]), //processor is based on arguments
  file = args[2] == 'csv' ? args[5] + '.csv' : args[5] + '.sql', //file is in querys if not from csv source
  dir = args[2] == 'csv' ? './csv/' : './querys/';*/

try {
  var source = require('./bin/sources/' + args[2]);
} catch (e) {
  error('"' + args[2] + '" is not a valid source.');
  error(e.stack);
  return;
}

try {
  var destination = require('./bin/destinations/' + args[4]);
} catch (e) {
  error('"' + args[4] + '" is not a valid destination.')
  error(e.stack);
  return;
}

async.waterfall([
  //moving to source - destination type
  function(cb) {
    source(args, function(err, opfile, log, timer) {
      if (err) return cb(err);
      //console.log(opfile);
      cb(null, opfile, log, timer);
    })
  },
  //attempt to get column definitions
  function(opfile, log, timer, cb) {
    colParser(opfile, function(err, columns) {
      if (err) return cb(err);
      //console.log(columns);
      cb(null, opfile, columns, log, timer);
    })
  },
  function(opfile, columns, log, timer, cb) {
    destination(args, opfile, columns, log, timer, function(err, opfile) {
      if (err) return cb(err);
      cb(null, opfile);
    })
  }
  /*function(cb) {
    //check file exists
    fs.stat(dir + file, function(err, stats) {
      if (err) return cb(err);
      log('Found query ' + file);
      cb(null);
    })
  },*/
  /*function(cb) {
    //process
    processor(file, function(err) {
      if (err) return cb(err);
      cb(null);
    })
  },*/

  /*function(cb) {
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
  }*/
], function(err, opfile) {
  try {
    opfile.clean();
  } catch (e) {

  }
  if (err) {
    error(tmr.now.str());
    return error(err);
  }

  l(tmr.now.str());
  l('Completed');
})
