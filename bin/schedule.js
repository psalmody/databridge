//move to current dir - for service running
process.chdir(__dirname);

var config = require('../config.json'),
  schedule = require('node-schedule'),
  parseBatch = require('./batch-parse'),
  bridge = require('./bridge'),
  schedules = require(config.schedule),
  jobs = [],
  runBridges = require('./bridge-runner'),
  dt;

schedules.forEach(function(sched) {
  //run as task - no spinner
  sched.task = true;
  console.log(sched);
  try {
    var j = schedule.scheduleJob(sched.cron, function() {
      switch (sched.type) {
        case 'batch':
          dt = new Date().toString();
          console.log('Starting batch ' + sched.name + ' at ' + dt);
          try {
            var bridges = parseBatch(sched.name, config.dirs.batches + sched.name);
            runBridges(bridges, function(err) {
              if (err) return console.error(err);
            });
          } catch (e) {
            console.log('Error in run bridges:');
            console.trace(e);
          }
          break;
        case 'bridge':
          dt = new Date().toString();
          console.log('Starting bridge ' + sched.name + ' at ' + dt);
          try {
            bridge(config, sched, function(err) {
              if (err) return console.error(err);
            });
          } catch (e) {
            console.log('Error in single bridge:', e);
          }

          break;
      }
    });
  } catch (e) {
    console.log(e);
  }
  jobs.push(j);
});
