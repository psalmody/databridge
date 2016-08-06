var cdDotDot = require('../bin/string-utilities').cdDotDot;
var assert = require('chai').assert;
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('../config.json'));
var setup = require('../bin/config-setup');
var defaultDir = cdDotDot(config.dirs.batches);
var newCfg = setup(defaultDir, undefined, undefined, 't-');

describe('Test config setup methods.', function() {
  it('Exposes config object.', function() {
    assert(typeof(newCfg.config) !== 'undefined', 'Config not defined.');
  });
  it('Exposes pm2 config.', function() {
    assert(typeof(newCfg.pm2Config) !== 'undefined', 'pm2 config not defined.');
  });
  it('Sets all dirs with default dir supplied.', function() {
    Object.keys(newCfg.config.dirs).forEach(function(k) {
      assert(newCfg.config.dirs[k].indexOf(defaultDir) !== -1, 'Directory for ' + k + ' not containing ' + defaultDir);
    });
    var app = newCfg.pm2Config.apps[0];
    assert(app.out_file.indexOf(defaultDir) !== -1, 'Directory for ' + app.out_file + ' not containing ' + defaultDir);
    assert(app.error_file.indexOf(defaultDir) !== -1, 'Directory for ' + app.error_file + ' not containing ' + defaultDir);
  });
  it('Verifies config.', function() {
    assert(newCfg.valid(), newCfg.valid());
  });
  it('Saves config files and they match returned config.', function() {
    newCfg.save();
    var newConfigFile = fs.readFileSync('./t-config.json', 'utf8').replace(/\n/g, '');
    var newPm2File = fs.readFileSync('./t-pm2.json', 'utf8').replace(/\n/g, '');
    var jsonNewCfg = JSON.stringify(newCfg.config, null, 2).replace(/\n/g, '');
    var jsonNewPm2 = JSON.stringify(newCfg.pm2Config, null, 2).replace(/\n/g, '');
    assert(jsonNewCfg === newConfigFile, 'New config file does not match generated file. Expected:\n' + jsonNewCfg + '\nReturned:\n' + newConfigFile);
    assert(jsonNewPm2 === newPm2File, 'New pm2 config does not match generated file.. Expected:\n' + jsonNewPm2 + '\nReturned:\n' + newPm2File);
    fs.unlinkSync('./t-config.json');
    fs.unlinkSync('./t-pm2.json');
    assert(!fs.existsSync('./t-config.json'), 'Could not clean up test config.json.');
    assert(!fs.existsSync('./t-pm2.json'), 'Could not clean up test pm2.json.');
  });

});
