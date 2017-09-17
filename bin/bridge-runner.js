/**
 * runBridges - function to run bridge functions async waterfall
 *
 * @param  {array} bridges       Array of bridge functions to run (see bin/batch-parse)
 * @param  {function} moduleCallback  called with error/null and response objects from bridges
 * @return {undefined}
 */
module.exports = function runBridges(bridges, moduleCallback) {
  const async = require('async');
  if (!bridges.length) return moduleCallback('No bridges found or defined. Check usage or batch file.');

  //run each bridge
  async.eachSeries(bridges, (bridge, cb) => {
    bridge.run(cb)
  }, function(err, responses) {
    if (err) {
      moduleCallback(err, responses);
      return;
    }
    moduleCallback(null, responses);
  });
};
