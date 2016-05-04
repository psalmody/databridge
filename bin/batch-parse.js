//batches should return an array of bridge functions to run
module.exports = function(batchName, batchFile) {
  var batch = require(batchFile);
  var bridge = require('./bridge');
  var bridges = [];
  var config = require('../config/' + process.env.NODE_ENV);

  batch.forEach(function(options) {
    var b = Object.create(options);
    //always use tasks unless specifically noted as not
    if (Object.keys(b).indexOf('task') === -1) b.task = true;
    b.batch = batchName;
    var fn = (function() {
      var options = Object.create(b);
      return function(responses, cb) {
        bridge(config, b, function(err, response) {
          if (err) return cb(err);
          //push clean version (no methods) of response
          responses.push(response.strip());
          cb(null, responses);
        })
      }
    })(b);
    bridges.push(fn);
  })
  return bridges;
}
