//prompts for configuration setup

var inquirer = require('inquirer');
var fs = require('fs');
var path = require('path');
var dirname = path.normalize(__dirname + '/local/').replace(/\\/g, '/');
var configSetup = require('./bin/config-setup');

var questions = [{
  type: 'input',
  name: 'defaultDir',
  default: dirname,
  message: 'Enter the directory location where the local output \n  and input files will be stored',
  validate: function(v) {
    if (!fs.existsSync(v)) return 'Does not exist.';
    if (!fs.lstatSync(v).isDirectory()) return 'Not a directory.';
    return true;
  }
}];

inquirer.prompt(questions).then(function(a) {
  var binds = (fs.existsSync('./config.json')) ? require('./config').defaultBindVars : {};
  var config = configSetup(a.defaultDir, {
    defaultBindVars: binds
  });
  var v = config.valid();
  if (v === true) {
    var r = config.save();
    if (r === true) return console.log('\nSaved config.\n\nIf you intend to connect to Oracle database, you can now:\n\n  npm install oracledb\n\nFor more information on oracledb install see:\n  https://github.com/psalmody/databridge/blob/master/INSTALL.md#oracle');
    console.log(r.toString());
  } else {
    console.log('Weird... the config tester said:\n  ' + v);
  }
});
