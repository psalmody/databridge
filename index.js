/**
 * This is the command-line wrapper for the bridging
 * tool prividing all the command line options.
 */

var program = require('./bin/cli'),
  async = require('async'),
  colors = require('colors'),
  fs = require('fs'),
  bridge = require('./bin/bridge'),
  missingKeys = require('./bin/missing-keys'),
  pkg = require('./package'),
  runBridges = require('./bin/bridge-runner'),
  config = require('./config.json'),
  //sources = fs.readdirSync(config.dirs.sources),
  destinations = fs.readdirSync(config.dirs.destinations),
  batches = fs.readdirSync(config.dirs.batches),
  removeFileExtension = require('./bin/string-utilities').removeFileExtension,
  sources = require('./bin/list-src');

//show valid tables
if (missingKeys(program, ['source', 'table', 'show']) == false) {
  fs.readdir(config.dirs.input + program.source, function(err, files) {
    if (err) return cb(err);
    console.log('Valid tables for ' + program.source + ':');
    files.forEach(function(file) {
      console.log('  ' + removeFileExtension(file));
    })
  })
  return;
}
//show valid sources
else if (missingKeys(program, ['source', 'show']) == false) {
  var srcs = sources(config);
  console.log('Valid sources:');
  srcs.forEach(function(v) {
    console.log('  ' + v);
  })
  return;
}
//show valid destinations
else if (missingKeys(program, ['destination', 'show']) == false) {
  npmls(function(err, pkgs) {
    for (key in pkgs.dependencies) {
      if (key.indexOf('databridge-destination-') !== -1) {
        var d = key.split('databridge-destination-')[1];
        destinations.push(d);
      }
    }
    destinations.sort();
    console.log('Valid destinations:');
    destinations.forEach(function(destination) {
      console.log('  ' + removeFileExtension(destination));
    })
  })
  return;
}
//show valid batches
else if (missingKeys(program, ['batch', 'show']) == false) {
  console.log('Valid batches:');
  batches.forEach(function(batch) {
    console.log('  ' + removeFileExtension(batch));
  })
  return;
}
//run batch if specified
else if (missingKeys(program, ['batch']) == false) {
  var parseBatch = require('./bin/batch-parse');
  var bridges = parseBatch(program.batch, config.dirs.batches + program.batch);
  runBridges(bridges, function(err, responses) {
    if (err) {
      console.error(colors.red(err));
      program.help();
      return;
    }
    if (config.logto == 'console') console.log(responses);
  });
  //})
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
    //only echo responses with development
    //TODO handle logging only this way #3 #4
    //if (config.logto == 'console') console.log(responses);
  });
}