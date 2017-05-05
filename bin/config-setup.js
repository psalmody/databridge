/**
 * config-setup - Used to setup config file
 *
 * @param  {string} dir base directory for local installation files
 * @param  {object} o   object passed here overrides any defaults
 * @param  {object} p   used to override standard pm2 log file schedule.log
 *                      should be object: {error_file: ..., out_file: ...}
 * @param  {string} t   for mocha tests only
 * @return {object}     {
 *                         config: config, //config object
 *                         pm2Config: pm2cfg, //pm2 config object
 *                         save: save, //function to save config file
 *                         valid: valid //function to check if valid config
 *                      }
 */
module.exports = function(dir, o, p, t) {

  var path = require('path');
  var fs = require('fs');
  var missingKeys = require('./missing-keys');

  //dirname
  var dirname = path.normalize(__dirname + '/..').replace(/\\/g, '/');

  //defaultDir required
  dir = (typeof(dir) == 'undefined') ? dirname + '/local' : path.normalize(dir).replace(/\\/g, '/');

  var cleanDir = function(d) {
    return path.normalize(d).replace(/\\|\/\//g, '/');
  };

  //file append for testing
  t = (typeof(t) == 'undefined') ? '' : t;

  //default config options
  var defaultCfg = {
    'dirs': {
      'batches': cleanDir(dir + '/batches/'),
      'creds': cleanDir(dir + '/creds/'),
      'destinations': cleanDir(dir + '/destinations/'),
      'input': cleanDir(dir + '/input/'),
      'logs': cleanDir(dir + '/logs/'),
      'output': cleanDir(dir + '/output/'),
      'sources': cleanDir(dir + '/sources/')
    },
    'logto': 'console',
    'defaultBindVars': {},
    'schedule': cleanDir(dir + '/schedule.json')
  };

  var pm2ErrorFile = (typeof(p) == 'undefined' || typeof(p.error_file) == 'undefined') ? cleanDir(dir + '/logs/schedule.log') : p.error_file;
  var pm2OutFile = (typeof(p) == 'undefined' || typeof(p.out_file) == 'undefined') ? cleanDir(dir + '/logs/schedule.log') : p.out_file;

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
      'error_file': pm2ErrorFile,
      'out_file': pm2OutFile,
      'log_date_format': 'YYYY-MM-DD HH:mm:ss Z'
    }]
  };

  var config = Object.assign({}, defaultCfg, o);

  var save = function() {
    try {
      fs.writeFileSync(dirname + '/' + t + 'config.json', JSON.stringify(config, null, 2));
    } catch (e) {
      return e;
    }
    try {
      fs.writeFileSync(dirname + '/' + t + 'pm2.json', JSON.stringify(pm2cfg, null, 2));
    } catch (e) {
      return e;
    }
    return true;
  };

  var valid = function() {
    var cdd = require('./string-utilities').cdDotDot;
    var dirs = ['batches', 'creds', 'destinations', 'input', 'logs', 'output', 'sources'];
    //check all dirs are assigned and exist
    var msg = missingKeys(config.dirs, dirs);
    if (msg instanceof Array) return 'Missing directories: ' + JSON.stringify(msg);
    dirs.forEach(function(d) {
      if (!fs.lstatSync(dir + '/' + d).isDirectory()) return dir + '/' + d + ' is not a directory.';
    });
    if (typeof(config.defaultBindVars) == 'undefined') return 'defaultBindVars not defined.';
    if (typeof(config.logto) == 'undefined') return 'logto not defined.';
    if (['console', 'file'].indexOf(config.logto) === -1) return 'logto type ' + config.logto + 'is not allowed. File or console only.';
    if (typeof(config.schedule) == 'undefined') return 'schedule not defined.';
    if (!fs.existsSync(config.schedule) || !fs.lstatSync(config.schedule).isFile()) return 'schedule file not a valid file at ' + config.schedule;
    var pm2 = pm2cfg.apps[0];
    return true;
  };

  return {
    config: config,
    pm2Config: pm2cfg,
    save: save,
    valid: valid
  };
};
