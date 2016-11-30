/**
 * batch-parse - batches should return an array of bridge functions to run
 *
 * @param  {string} batchName name of the batch (for logging/output folder)
 * @param  {string} batchFile path of the json batch file
 * @return {array}           array of bridge functions to run
 */
module.exports = function(batchName, batchFile) {
  var batch = require(batchFile);
  var bridge = require('./bridge');
  var bridges = [];
  var config = require('../config.json');

  batch.forEach(function(options) {
    var b = Object.create(options);
    //always use tasks unless specifically noted as not
    if (Object.keys(b).indexOf('task') === -1) b.task = true;
    b.batch = batchName;
    //assume it's a bridge, not a script
    if (Object.keys(b).indexOf('type') === -1) b.type = 'bridge';
    //handle script type
    if (options.type == 'script') {
      var fn = (function() {
        var script = require(config.dirs.input + b.name);
        return function(responses, cb) {
          script(config, b, function(err, response) {
            if (err) return cb(err);
            //push clean version (no methods) of response
            responses.push(response);
            cb(null, responses);
          });
        };
      })(b);
    } else if (options.type == 'bridge') {
      var fn = (function() {
        return function(responses, cb) {
          bridge(config, b, function(err, response) {
            if (err) return cb(err);
            //push clean version (no methods) of response
            responses.push(response.strip());
            cb(null, responses);
          });
        };
      })(b);
    }

    bridges.push(fn);
  });
  return bridges;
};
