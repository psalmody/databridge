//move to current dir - for service running
process.chdir(__dirname);

var s = {};
var config = require('../config.js');
var fs = require('fs');
var schedule = require('node-schedule');
var parseBatch = require('./batch-parse');
var bridge = require('./bridge');
var schedules = require(config.schedule);
var jobs = [];
var service = require('os-service');
var program = require('commander');
var pkg = require('../package');
var newline = '\n               ';

var runBridges = require('./bridge-runner');

program.version(pkg.version)
  .usage('[options]')
  .option('--add', 'Add service. Name defined by config.')
  .option('--remove', 'Remove service. Name defined by config.')
  .option('--run', 'Run here at command line. Use local service ' + newline + 'manager to start without open terminal.')
  .on('--help', function() {

  })
  .parse(process.argv);

if (program.add) {
  var options = {
    programArgs: ["--run"]
  };
  service.add(config.service.name, options, function(err) {
    if (err) return console.trace(err);
    console.log("Started service " + config.service.name + ". Start with:\n  Windows: net start \"" + config.service.name + "\"\n  Linux:  service " + config.service.name + " start");
  })
} else if (program.remove) {
  service.remove(config.service.name, function(err) {
    if (err) return console.trace(err);
  })
} else if (program.run) {

  var logStream = fs.createWriteStream(config.service.log, {
    defaultEncoding: 'utf8'
  });

  var errorStream = fs.createWriteStream(config.service.log + '.error.txt', {
    defaultEncoding: 'utf8'
  })


  service.run(logStream, errorStream, function() {
    service.stop(0);
  })

  schedules.forEach(function(sched) {
    //run as task - no spinner
    sched.task = true;
    console.log(sched);
    try {
      var j = schedule.scheduleJob(sched.cron, function() {
        switch (sched.type) {
          case "batch":
            var dt = new Date().toString();
            console.log('Starting batch ' + sched.name + ' at ' + dt);
            try {
              var bridges = parseBatch(sched.name, config.dirs.batches + sched.name);
              runBridges(bridges, function(err, responses) {
                if (err) return console.error(err);
                //console.log(responses);
              })
            } catch (e) {
              console.log('Error in run bridges:');
              console.trace(e);
            }
            break;
          case "bridge":
            var dt = new Date().toString();
            console.log('Starting bridge ' + sched.name + ' at ' + dt);
            try {
              bridge(config, sched, function(err, response) {
                if (err) return console.error(err);
                //console.log(response.strip());
              })
            } catch (e) {
              console.log('Error in single bridge:', e);
            }

            break;
        }
        //console.log(new Date().toString());
      })
    } catch (e) {
      console.log(e);
    }
    jobs.push(j);
  });

} else {
  program.help();
}



//module.exports = s;
