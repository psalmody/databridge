var assert = require('chai').assert;
var service = require('../bin/service');
var serviceName = 'DatabridgeTestingService';

describe('Testing scheduler', function() {
  /*it('Starts a service', function(done) {
    service.add(serviceName, function(err) {
      if (err) return done(err);
      done();
    });
  });*/

  it('Runs the service', function(done) {
    service.run();
    done();
  })

  //where do the "jobs" live? must be config files...
  it('Adds scheduled jobs');
  it('Runs the scheduled job at the appropriate time');

  it('Ends the service');
  /*it('Removes the service', function(done) {
    service.remove(serviceName, function(err) {
      if (err) assert(false, err);
      done();
    });
  });*/
});
