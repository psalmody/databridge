//function to run bridge functions async waterfall

module.exports = function runBridges(bridges, moduleCallback) {
  var async = require('async');
  if (!bridges.length) return moduleCallback('No bridges found or defined. Check usage or batch file.');
  //push dummy function to beginning of async
  //so we get a responses object
  bridges.unshift(function(cb) {
    //push empty array into first function
    //for responses
    return cb(null, []);
  });

  //taking all bridge functions created and Running
  //them one at a time

  async.waterfall(bridges, function(err, responses) {
    if (err) {
      moduleCallback(err, responses);
      return;
    }
    moduleCallback(null, responses);
  });
};
