/**
 * This is the command-line wrapper for the bridging
 * tool prividing all the command line options.
 */

var program = require('commander'),
  async = require('async'),
  colors = require('colors'),
  fs = require('fs'),
  bridge = require('./bin/bridge'),
  missingKeys = require('./bin/missingKeys'),
  pkg,
  sources = [],
  destinations = [],
  batches = [];

//assume we're in development
process.env.NODE_ENV = typeof(process.env.NODE_ENV) == 'undefined' ? 'development' : process.env.NODE_ENV;

async.waterfall([
    //get package.json (for version exposure)
    function(cb) {
      //console.log('read package.json');
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
        //sources exclude .js extensions
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
        //again - exclude .js extension
        for (var i = 0; i < files.length; i++) {
          destinations.push(files[i].replace('.js', ''));
        }
        cb(null);
      })
    },
    //get batches
    function(cb) {
      fs.readdir('./batches', function(err, files) {
        if (err) return cb(err);
        for (var i = 0; i < files.length; i++) {
          batches.push(files[i].replace('.json', ''));
        }
        cb(null);
      })
    },
    //setup commander
    function(cb) {
      var newline = '\n                                 ';
      program.version(pkg.version)
        .usage('[options]')
        .option('-s, --source [source]', 'Specify source from bin/sources/. ' + newline + 'Currently installed: ' + sources.join(', '))
        .option('-t, --table [table]', 'Specify query or input file name (no file extension). ' + newline + 'Try --source <source> and --show for a list of inputs ' + newline + 'for that source.')
        .option('-d, --destination [destination]', 'Specify destination from bin/destinations/. ' + newline + 'Current installed: ' + destinations.join(', '))
        .option('-h, --show', 'Shows valid sources/destinations/tables.')
        .option('-b, --binds', 'Use default binds from input/binds.js rather than prompting ' + newline + '(applies to some sources only).')
        .option('-k, --task', 'This command is a schedule task or piping to output file.' + newline + 'Don\'t generate processing spinner.')
        .option('--batch [batch]', 'Run json [batch] from batches/')
        .on('--help', function() {
          console.log('  Examples: ');
          console.log('');
          console.log('    Run dbutil for rptp query employees into mysql:');
          console.log('    > node app -s rptp -t employees -d mysql');
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
      //parse command options for
      //show valid source table options
      if (missingKeys(program, ['source', 'table', 'show']) == false) {
        fs.readdir('./input/' + program.source, function(err, files) {
          if (err) return cb(err);
          var valid = [];
          for (var i = 0; i < files.length; i++) {
            if (files[i].indexOf('.') !== 0) valid.push(files[i].replace(/.sql|.js|.csv|.txt/g, ''));
          }
          console.log('Valid tables for ' + program.source + ':');
          console.log('  ' + valid.join(', '));
        })
        return;
      }
      //show valid sources
      else if (missingKeys(program, ['source', 'show']) == false) {
        console.log('Valid sources:');
        console.log('  ' + sources.join(', '));
        process.exit();
      }
      //show valid destinations
      else if (missingKeys(program, ['destination', 'show']) == false) {
        console.log('Valid destinations:');
        console.log('  ' + destinations.join(', '));
        process.exit();
      }
      //show valid batches
      else if (missingKeys(program, ['batch', 'show']) == false) {
        console.log('Valid batches:');
        console.log('  ' + batches.join(', '));
        process.exit();
      }
      //define array of bridge functions to run
      var bridges = [];
      //run bridge batch
      if (missingKeys(program, ['batch']) == false) {
        fs.readFile('./batches/' + program.batch + '.json', 'utf-8', function(err, json) {
          if (err) return cb(err);
          var batch = JSON.parse(json);

          for (var i = 0; i < batch.length; i++) {
            var b = batch[i];
            //set to task by default
            if (Object.keys(batch[i]).indexOf('task') === -1) batch[i].task = true;
            batch[i].batch = program.batch;
            var fn = (function() {
              var options = JSON.parse(JSON.stringify(b));
              return function(cb2) {
                bridge(options, function(err) {
                  if (err) return cb2(err);
                  cb2(null);
                })
              }
            })(b);
            bridges.push(fn);
          }
          cb(null, bridges);
        })


      } else {
        //otherwise, run bridge once
        var missing = missingKeys(program, ['source', 'destination', 'table']);
        if (missing.length) return cb('Wrong usage.');
        //push program version
        bridges.push(function(cb2) {
          bridge({
            source: program.source,
            destination: program.destination,
            binds: program.binds,
            table: program.table,
            task: program.task
          }, function(err) {
            if (err) return cb2(err);
            cb2(null);
          })
        })
        cb(null, bridges);
      }
    },
    //run bridge functions async style
    function(bridges, cb) {
      if (!bridges.length) return cb('No bridges found or defined. Check usage or batch file.');
      //taking all bridge functions created and Running
      //them one at a time
      async.waterfall(bridges, function(err) {
        if (err) return cb(err);
        cb(null);
      })
    }
  ],
  function(err) {
    if (err) {
      console.error(colors.red(err));
      program.help();
    }
  })
