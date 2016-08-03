/**
 * Pizza delivery prompt example
 * run example by writing `node pizza.js` in your console
 */

var inquirer = require('inquirer');
var binds = require('./bin/bind-setup');

var main = function() {
  var questions = [{
    type: 'list',
    name: 'action',
    message: 'Modify default bind variables. Choose an action:',
    choices: [{
      name: 'List binds',
      value: 'list'
    }, {
      name: 'Add bind',
      value: 'add'
    }, {
      name: 'Change bind',
      value: 'change'
    }, {
      name: 'Remove bind',
      value: 'remove'
    }]
  }];

  inquirer.prompt(questions).then(function(answers) {
    switch (answers.action) {
      case 'list':
        list();
        break;
      case 'add':
        add();
        break;
      case 'change':
        change();
        break;
      case 'remove':
        remove();
        break;
      default:
        console.log('No option specified.');
    }
  });
};

var list = function() {
  console.log('Listing all binds:');
  var l = binds.list();
  Object.keys(l).forEach(function(k) {
    console.log('  ', k, ': ', l[k]);
  });
};

var add = function() {
  var qs = [{
    type: 'input',
    name: 'key',
    message: 'Enter the bind variable name/key',
    validate: function(v) {
      return (v.indexOf(' ') == -1) ? true : 'Spaces not allowed.';
    }
  }, {
    type: 'input',
    name: 'value',
    message: 'Enter the bind variable value'
  }];
  inquirer.prompt(qs).then(function(a) {
    if (binds.exists(a.key)) {
      var q2s = [{
        type: 'confirm',
        name: 'confirm',
        message: 'This variable exists. Overwrite?',
        default: false
      }];
      inquirer.prompt(q2s).then(function(a2) {
        if (a2.confirm) {
          binds.add(a.key, a.value, true);
          console.log('Overwrote bind variable "' + a.key + '" with value "' + a.value + '".');
        } else {
          console.log('Aborted.');
        }
      });
    } else {
      binds.add(a.key, a.value);
      console.log('Added bind variable', a.key, 'with value', a.value, '.');
    }
  });
};

var change = function() {
  var l = Object.keys(binds.list());
  var qs = [{
    type: 'list',
    name: 'bind',
    message: 'Choose variable to change',
    choices: l
  }];
  inquirer.prompt(qs).then(function(a) {
    var q2 = [{
      type: 'input',
      name: 'val',
      message: 'Enter the bind variable value',
      default: binds.getValue(a.bind)
    }];
    inquirer.prompt(q2).then(function(a2) {
      console.log(a2);
      binds.add(a.bind, a2.val, true);
      console.log('Changed bind variable "' + a.bind + '" to "' + a2.val + '".');
    });
  });
};

var remove = function() {
  var l = Object.keys(binds.list());
  console.log(l);
  var qs = [{
    type: 'list',
    name: 'bind',
    message: 'Choose variable to remove',
    choices: l
  }, {
    type: 'confirm',
    name: 'confirm',
    default: false,
    message: 'Are you sure you want to delete that bind variable?'
  }];
  inquirer.prompt(qs).then(function(a) {
    if (a.confirm == false) {
      console.log('Cancelled.');
      return;
    }
    binds.remove(a.bind);
    console.log('Removed bind variable', a.bind);
  });
};

main();
