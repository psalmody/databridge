var assert = require('chai').assert,
  fs = require('fs'),
  cfg = require('../config.json'),
  bind = require('../bin/bind-setup'),
  newBind = 'databridge-test-bind';

describe('Testing config.json query binds', function() {


  it('Config has defaultBindVars key.', function() {
    assert(typeof(cfg.defaultBindVars) !== 'undefined');
  });

  it('Should list all binds', function() {
    assert(Object.keys(bind.list()).length == Object.keys(cfg.defaultBindVars).length);
  });

  it('Should add new bind.', function() {
    var a = bind.add(newBind, 'testing');
    assert(a == true, a);
  });

  it('Should not add over existing add without confirm.', function() {
    assert(bind.add(newBind, 'testing2') !== true);
  });

  it('Should check for existing bind.', function() {
    assert(bind.exists(newBind));
  });

  it('Should remove bind.', function() {
    bind.remove(newBind);
    cfg2 = JSON.parse(fs.readFileSync('config.json'));
    assert(typeof(cfg2.defaultBindVars[newBind]) == 'undefined');
  });

});
