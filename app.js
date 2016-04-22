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
  runBridges = require('./bin/bridge-runner'),
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

//run batch if specified
if (missingKeys(program, ['batch']) == false) {
  var parseBatch = require('./bin/batches');
  parseBatch(program.batch, config.dirs.batches + program.batch, function(bridges) {
    runBridges(bridges, function(err, responses) {
      if (err) {
        console.error(colors.red(err));
        program.help();
        return;
      }
      if (process.env.NODE_ENV == 'development') console.log(responses);
    });
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
  //run one bridge
  runBridges([function(responses, cb) {
    bridge(config, {
      source: program.source,
      destination: program.destination,
      binds: program.binds,
      table: program.table,
      task: program.task,
      update: program.update
    }, function(err, response) {
      if (err) return cb(err);
      //push clean version (no methods) of response
      responses.push(response.strip());
      cb(null, responses);
    })
  }], function(err, responses) {
    if (err) {
      console.error(colors.red(err));
      program.help();
      return;
    }
    if (process.env.NODE_ENV == 'development') console.log(responses);
  });
}
