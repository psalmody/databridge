var program = require('commander'),
  async = require('async'),
  colors = require('colors'),
  fs = require('fs'),
  bridge = require('./bin/bridge'),
  pkg,
  sources = [],
  destinations = [];

function requiredKeys(obj, arr) {
  if (typeof(obj) !== 'object') return false;
  if (typeof(arr) !== 'object' || !arr.length) return false;
  var missing = [];
  for (var i = 0; i < arr.length; i++) {
    if (typeof(obj[arr[i]]) == 'undefined') missing.push(arr[i]);
  }
  return missing.length ? missing : true;
}

async.waterfall([
  //get package.json
  function(cb) {
    fs.readFile('package.json', 'utf-8', function(err, contents) {
      if (err) return cb(err);
      pkg = JSON.parse(contents);
      cb(null);
    })
  },
  //get valid sources
  function(cb) {
    fs.readdir('./bin/sources', function(err, files) {
      if (err) return cb(err);
      for (var i = 0; i < files.length; i++) {
        sources.push(files[i].replace('.js', ''));
      }
      cb(null);
    })
  },
  //get valid destinations
  function(cb) {
    fs.readdir('./bin/destinations', function(err, files) {
      if (err) return cb(err);
      for (var i = 0; i < files.length; i++) {
        destinations.push(files[i].replace('.js', ''));
      }
      cb(null);
    })
  },
  //setup commander
  function(cb) {
    var newline = '\n                                 ';
    program.version(PKG.version)
      .usage('[options]')
      .option('-s, --source [source]', 'Specify source from bin/sources/. ' + newline + 'Currently installed: ' + sources.join(', '))
      .option('-t, --table [table]', 'Specify query or input file name (no file extension). ' + newline + 'Try --source <source> and --show for a list of inputs ' + newline + 'for that source.')
      .option('-d, --destination [destination]', 'Specify destination from bin/destinations/. ' + newline + 'Current installed: ' + destinations.join(', '))
      .option('-h, --show', '(With --source) shows valid --table inputs for that source.')
      .option('-b, --binds', 'Use default binds from input/binds.js rather than prompting ' + newline + '(applies to some sources only).')
      .option('--batch [batch]', 'Run json [batch] from batches/')
      .parse(process.argv);
    if (requiredKeys(program, ['source', 'show'])) {
      //TODO add show source table options
      return;
    }
    if (requiredKeys(program, ['batch'])) {
      //TODO add batch file functionality
      return;
    }
    //otherwise, run bridge once
    var missing = requiredKeys(program, ['source', 'destination', 'table']);
    if (missing.length) return cb('Missing ' + missing.join(', '));
    cb(null);
  }
  //TODO add actual bridge call
], function(err) {
  if (err) {
    console.error(colors.red(err));
    program.help();
  }
})

var PKG = JSON.parse(fs.readFileSync('package.json', {
  encoding: 'utf-8'
}));
