/**
 * This is the command-line wrapper for the bridging
 * tool prividing all the command line options.
 */

//assume we're in development
process.env.NODE_ENV = typeof(process.env.NODE_ENV) == 'undefined' ? 'development' : process.env.NODE_ENV;

var program = require('./bin/cli'),
  async = require('async'),
  colors = require('colors'),
  fs = require('fs'),
  bridge = require('./bin/bridge'),
  missingKeys = require('./bin/missing-keys'),
  pkg = require('./package'),
  config = require('./config/' + process.env.NODE_ENV),
  sources = fs.readdirSync(config.dirs.sources),
  destinations = fs.readdirSync(config.dirs.destinations),
  batches = fs.readdirSync(config.dirs.batches);

//show valid tables
if (missingKeys(program, ['source', 'table', 'show']) == false) {
  fs.readdir(config.dirs.input + program.source, function(err, files) {
    if (err) return cb(err);
    var valid = [];
    for (var i = 0; i < files.length; i++) {
      if (files[i].indexOf('.') !== 0) valid.push(files[i].replace(/.sql|.js|.csv|.txt/g, ''));
    }
    console.log('Valid tables for ' + program.source + ':');
    console.log('  ' + valid.join('\n  '));
  })
  return;
}
//show valid sources
else if (missingKeys(program, ['source', 'show']) == false) {
  console.log('Valid sources:');
  console.log('  ' + sources.join('\n  '));
  process.exit();
}
//show valid destinations
else if (missingKeys(program, ['destination', 'show']) == false) {
  console.log('Valid destinations:');
  console.log('  ' + destinations.join('\n  '));
  process.exit();
}
//show valid batches
else if (missingKeys(program, ['batch', 'show']) == false) {
  console.log('Valid batches:');
  console.log('  ' + batches.join(', '));
  process.exit();
}

//function to run bridge functions async waterfall
function runBridges(bridges) {
  if (!bridges.length) return cb('No bridges found or defined. Check usage or batch file.');
  //taking all bridge functions created and Running
  //them one at a time
  async.waterfall(bridges, function(err) {
    if (err) {
      console.error(colors.red(err));
      program.help();
    }
  })
}

//define array of bridge functions to run
var bridges = [];
//run batch if specified
if (missingKeys(program, ['batch']) == false) {
  fs.readFile(config.dirs.batches + program.batch + '.json', 'utf-8', function(err, json) {
    if (err) return console.error(colors.red(err));
    var batch = JSON.parse(json);

    for (var i = 0; i < batch.length; i++) {
      var b = batch[i];
      //set to task by default
      if (Object.keys(batch[i]).indexOf('task') === -1) batch[i].task = true;
      batch[i].batch = program.batch;
      var fn = (function() {
        var options = JSON.parse(JSON.stringify(b));
        return function(cb) {
          bridge(config, options, function(err) {
            if (err) return cb(err);
            cb(null);
          })
        }
      })(b);
      bridges.push(fn);
    }
    runBridges(bridges);
  })
} else {
  //otherwise, run bridge once
  //only source / destination are required - each source module should throw
  //an error if table is necessary
  var missing = missingKeys(program, ['source', 'destination']);
  if (missing.length) {
    console.error(colors.red('Wrong usage.'));
    program.help();
  }
  //push program version
  bridges.push(function(cb) {
    bridge(config, {
      source: program.source,
      destination: program.destination,
      binds: program.binds,
      table: program.table,
      task: program.task,
      update: program.update
    }, function(err) {
      if (err) return cb(err);
      cb(null);
    })
  })
  runBridges(bridges);
}
