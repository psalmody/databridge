process.env.NODE_ENV = typeof(process.env.NODE_ENV) == 'undefined' ? "production" : process.env.NODE_ENV.trim();
process.chdir(__dirname);

//console.log(__dirname);


var s = {};
var config = require('../config/' + process.env.NODE_ENV);
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
    if (err) console.trace(err);
    console.log("Started service " + config.service.name + ". Start with:\n  Windows: net start \"" + config.service.name + "\"\n  Linux:  service " + config.service.name + " start");
  })
} else if (program.remove) {
  service.remove(config.service.name, function(err) {
    if (err) return console.log(err);
  })
} else if (program.run) {

  var logStream = fs.createWriteStream(config.service.log, {
    defaultEncoding: 'utf8'
  });


  service.run(logStream, function() {
    service.stop(0);
  })

  schedules.forEach(function(sched) {
    var j = schedule.scheduleJob(sched.cron, function() {
      switch (sched.type) {
        case "batch":
          var bridges = parseBatch(sched.name, config.dirs.batches + sched.name);
          runBridges(bridges, function(err, responses) {
            if (err) return console.error(err);
            console.log(responses);
          })
          break;
        case "bridge":
          bridge(config, sched, function(err, response) {
            if (err) return console.error(err);
            console.log(response.strip());
          })
          break;
      }
    })
    jobs.push(j);
  });

} else {
  program.help();
}



//module.exports = s;
