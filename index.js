/**
 * This is the command-line wrapper for the bridging
 * tool prividing all the command line options.
 */

var program = require('./bin/cli'),
  colors = require('colors'),
  fs = require('fs'),
  bridge = require('./bin/bridge'),
  missingKeys = require('./bin/missing-keys'),
  runBridges = require('./bin/bridge-runner'),
  config = require('./config.json'),
  removeFileExtension = require('./bin/string-utilities').removeFileExtension;

//show valid tables
if (missingKeys(program, ['source', 'table', 'show']) == false) {
  fs.readdir(config.dirs.input + program.source, function(err, files) {
    if (err) return console.error(err);
    console.log('Valid tables for ' + program.source + ':');
    files.forEach(function(file) {
      console.log('  ' + removeFileExtension(file));
    });
  });
}
//show valid sources
else if (missingKeys(program, ['source', 'show']) == false) {
  var srcs = require('./bin/list-src')(config);
  console.log('Valid sources:');
  srcs.forEach(function(v) {
    console.log('  ' + v);
  });
}
//show valid destinations
else if (missingKeys(program, ['destination', 'show']) == false) {
  var dests = require('./bin/list-dest')(config);
  console.log('Valid destinations:');
  dests.forEach(function(v) {
    console.log('  ' + v);
  });
}
//show valid batches
else if (missingKeys(program, ['batch', 'show']) == false) {
  var batches = fs.readdirSync(config.dirs.batches);
  console.log('Valid batches:');
  batches.forEach(function(batch) {
    console.log('  ' + removeFileExtension(batch));
  });
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
    });
  }], function(err) {
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
