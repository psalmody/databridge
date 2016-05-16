var program = require('commander'),
  pkg = require('../package');

var newline = '\n                                 ';
program.version(pkg.version)
  .usage('[options]')
  .option('-s, --source [source]', 'Specify source from bin/sources/. ')
  .option('-t, --table [table]', 'Specify query or input file name (no file extension). ' + newline + 'Try: -s <source> -h for a list of inputs.')
  .option('-d, --destination [destination]', 'Specify destination from bin/destinations/. ')
  .option('-h, --show', 'Shows valid sources/destinations/tables.')
  .option('-b, --binds', 'Use default binds from input/binds.js rather than prompting ' + newline + '(applies to some sources only).')
  .option('-k, --task', 'This command is a schedule task or piping to output file.' + newline + 'Don\'t generate processing spinner.')
  .option('-c, --batch [batch]', 'Run json [batch] from batches/')
  .option('-u, --update', 'Update table (insert data only) don\'t overwrite ' + newline + 'existing table or update table structure (for database destinations).')
  .on('--help', function() {
    console.log('  Examples: ');
    console.log('');
    console.log('    Run databridge for oracle query employees into mysql:');
    console.log('    > node app -s oracle -t employees -d mysql');
    console.log('');
    console.log('    Show all valid sources:');
    console.log('    > node app -hs');
    console.log('');
    console.log('    Show all valid destinations:');
    console.log('    > node app -hd');
    console.log('');
    console.log('    Run batch of data bridges:');
    console.log('    > node app --batch batchplease');
    console.log('');
    console.log('    Show all valid tables for that source:');
    console.log('    > node app -s <source> -ht');
  })
  .parse(process.argv);

module.exports = program;
