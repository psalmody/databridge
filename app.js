/**
 * This is the command-line wrapper for the bridging
 * tool prividing all the command line options.
 */

const program = require('./bin/cli')
const colors = require('colors')
const missingKeys = require('./bin/missing-keys')
const runBridges = require('./bin/bridge-runner')
const config = require('./config.json')

//show valid tables
if (['source','table','show'].every(e => Object.keys(program).includes(e))) {
  try {
    console.log('\n  Valid tables for ' + program.source + ':')
    require('./bin/list-tables')(program.source).map(t => console.log(`   ${t}`))
  } catch (e) {
    console.log(e)
  }
}
//show valid sources
else if (['source','show'].every(e=>Object.keys(program).includes(e)) && program.source === true) {
  console.log('\n  Valid sources:');
  require('./bin/list-src')(config).map(v => console.log(`    ${v}`));
}
//show valid destinations
else if (['destination','show'].every(e => Object.keys(program).includes(e))) {
  console.log('\n  Valid destinations:')
  require('./bin/list-dest')(config).map(v => console.log(`    ${v}`))
}
//show valid batches
else if (['batch','show'].every(e => Object.keys(program).includes(e))) {
  console.log('\n  Valid batches:');
  require('./bin/list-batches')().map(v => console.log(`    ${v}`))
}
//run batch if specified
else if (Object.keys(program).includes('batch')) {
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
  const Bridge = require('./bin/bridge')
  const bridge = new Bridge({config: config, opt: {
    source: program.source,
    destination: program.destination,
    binds: program.binds,
    table: program.table,
    update: program.update,
    truncate: program.truncate
  }})
  bridge.run((err,response) => {
    if (err) {
      process.stdout.clearLine()
      process.stdout.cursorTo(0)
      console.error(err)
      return;
    }
  })
}
