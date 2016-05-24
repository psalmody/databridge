/**
 * Command-line interface for bin\clean module
 */

//assume we're in development
var colors = require('colors/safe'),
  program = require('commander'),
  config = require('./config.js'),
  pkg = require('./package'),
  cleaner = require('./bin/clean');

//parse command-line
program.version(pkg.version)
  .usage('[options] <keywords>')
  .option('-d, --days <n>', 'Keep logs/output files older than <n> days. Use 0 to delete all. Default is 7 days.', parseInt)
  .parse(process.argv);
var days = typeof(program.days) == 'undefined' ? 7 : program.days;

//setup options
var opts = {
  days: days,
  dirs: config.dirs
}

//run cleanup
cleaner(opts, function(err, res) {
  if (err) return console.log(colors.red(err));
  console.log(res);
})
