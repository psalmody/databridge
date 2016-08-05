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
}, {
  type: 'list',
  name: 'logto',
  message: 'Setup logging to',
  choices: [{
    name: 'Files',
    value: 'file'
  }, {
    name: 'Console',
    value: 'console'
  }]
}];

inquirer.prompt(questions).then(function(a) {
  var binds = (fs.existsSync('./config.json')) ? require('./config').defaultBindVars : {};
  var config = configSetup(a.defaultDir, {logto: a.logto, defaultBindVars: binds});
  var v = config.valid();
  if (v === true) {
    var r = config.save();
    if (r === true) return console.log('Saved config.');
    console.log(r.toString());
  } else {
    console.log('Weird... the config tester said:\n  ' + v);
  }
});
