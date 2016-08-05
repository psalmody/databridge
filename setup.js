//prompts for configuration setup

var prompt = require('prompt'),
  colors = require('colors'),
  async = require('async'),
  fs = require('fs');

var l = console.log,
  dirname = __dirname.replace(/\\/g, '/').toLowerCase(),
  filename = dirname + '/config.json',
  defaultdir = dirname + '/';

var cfg = {
  'dirs': {
    'batches': dirname + '/local/batches/',
    'creds': dirname + '/local/creds/',
    'destinations': dirname + '/local/destinations/',
    'input': dirname + '/local/input/',
    'logs': dirname + '/local/logs/',
    'output': dirname + '/local/output/',
    'sources': dirname + '/local/sources/'
  },
  'logto': 'console',
  'defaultBindVars': {},
  'schedule': dirname + '/local/schedule.json'
};

var pm2cfg = {
  'apps': [{
    'name': 'databridge',
    'script': 'bin/schedule.js',
    'watch': ['bin/schedule.js', 'pm2.json'],
    'env': {
      'NODE_ENV': 'development',
    },
    'env_production': {
      'NODE_ENV': 'production'
    },
    'error_file': dirname + '/local/logs/schedule.log',
    'out_file': dirname + '/local/logs/schedule.log',
    'log_date_format': 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

function addTrailingSlash(s) {
  s.replace(/\\/g, '/');
  if (s.substring(s.length - 1, s.length) == '/') return s;
  return s + '/';
}

l(colors.green('Welcome to setup for'), colors.blue('databridge'), colors.green('.'));
l(colors.white('Setting up local config file.'));
l(colors.white('Type values and press enter or press enter to accept defaults.'));

async.waterfall([
  function(cb) {
    //test for existing config file first
    try {
      if (!fs.lstatSync(filename).isFile()) return cb(null);
    } catch (e) {
      return cb(null);
    }
    //make sure we want to overwrite
    console.log(colors.red('WARN:'), 'config.json already exists at ' + filename);
    prompt.message = '  Overwrite?';
    var p = {
      properties: {
        overwrite: {
          default: 'n',
          description: 'yes/no or y/n'
        }
      }
    };
    prompt.start();
    prompt.get(p, function(err, results) {
      if (err) return cb(err);
      if (results.overwrite !== 'yes' && results.overwrite !== 'y') return cb('Config file exists. Not overwriting.');
      cb(null);
    });
  },
  function(cb) {
    //prompt for default dir
    console.log('Enter the main directory for local files.');
    prompt.message = colors.green('  Directory');
    var p = {
      properties: {
        'defaultdir': {
          default: defaultdir,
          description: colors.green('Main local directory')
        }
      }
    };
    prompt.start();
    prompt.get(p, function(err, results) {
      if (err) return cb(err);
      defaultdir = addTrailingSlash(results.defaultdir);
      cb(null);
    });
  },
  function(cb) {
    // prompt for directories
    prompt.message = colors.green('  Local directory for');
    var dirPrompts = {
      properties: {

      }
    };

    Object.keys(cfg.dirs).forEach(function(d) {
      dirPrompts.properties[d] = {
        default: addTrailingSlash(defaultdir + d),
        description: colors.green(d)
      };
    });
    prompt.start();
    prompt.get(dirPrompts, function(err, results) {
      if (err) return cb(err);
      Object.keys(results).forEach(function(v) {
        cfg.dirs[v] = addTrailingSlash(results[v]);
      });
      cb(null);
    });
  },
  function(cb) {
    // prompt for log
    prompt.message = colors.green('  Log style');
    console.log('Choose a log style.');
    var logPrompt = {
      properties: {
        logto: {
          default: 'console',
          description: colors.green('console or file')
        }
      }
    };
    prompt.start();
    prompt.get(logPrompt, function(err, results) {
      if (err) return cb(err);
      cfg.logto = results.logto;
      cb(null);
    });
  },
  function(cb) {
    //prompt for scheduler setup
    prompt.message = colors.green('  Scheduler');
    console.log('Would you to setup configuration for the scheduler pm2/service?');
    var schPrompt = {
      properties: {
        sch: {
          default: 'yes',
          description: colors.green('yes or no')
        }
      }
    };
    prompt.start();
    prompt.get(schPrompt, function(err, results) {
      if (err) return cb(err);
      cb(null, results.sch);
    });
  },
  function(sch, cb) {
    if (sch !== 'yes' && sch !== 'y') {
      delete cfg.schedule;
      delete cfg.service;
      return cb(null);
    }
    //prompt for scheduler settings
    console.log('Enter the following options.');
    var schPrompt = {
      properties: {
        schedule: {
          default: defaultdir + 'schedule.json',
          description: colors.green('Location of schedule job file')
        },
        log: {
          default: cfg.dirs.logs + 'schedule.log',
          description: colors.green('Service log file')
        }
      }
    };
    prompt.start();
    prompt.get(schPrompt, function(err, results) {
      if (err) return cb(err);
      cfg.schedule = results.schedule;
      pm2cfg.apps[0].out_file = results.log;
      pm2cfg.apps[0].error_file = results.log;
      cb(null, sch);
    });
  },
  function(sch, cb) {
    //write log file
    fs.writeFile(filename, JSON.stringify(cfg, null, 2), function(err) {
      if (err) return cb(err);
      cb(null, sch);
    });
  },
  function(sch, cb) {
    //write pm2.json if setting up scheduler
    if (sch !== 'yes' && sch !== 'y') return cb(null);
    fs.writeFile('pm2.json', JSON.stringify(pm2cfg, null, 2), function(err) {
      if (err) return cb(err);
      cb(null);
    });
  }
], function(err) {
  if (err) return console.error(colors.red(err));
  console.log(colors.green('Success!'), 'Created config file at ' + filename);
  console.log('Recommend testing config file with:\n\n  mocha spec/config');
});
