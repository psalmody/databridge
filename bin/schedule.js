//move to current dir - for service running
process.chdir(__dirname);

var s = {};
var config = require('../config.json');
var fs = require('fs');
var schedule = require('node-schedule');
var parseBatch = require('./batch-parse');
var bridge = require('./bridge');
var schedules = require(config.schedule);
var jobs = [];
var program = require('commander');
var pkg = require('../package');
var newline = '\n               ';
var runBridges = require('./bridge-runner');

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
    })
  } catch (e) {
    console.log(e);
  }
  jobs.push(j);
});
