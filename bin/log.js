module.exports = (opt) => {

  const winston = require('winston')



  let logger = new (winston.Logger) ({
    transports: [

    ]
  })

  var log = new Object();
  log.g = '';
  log.filename = false;
  log.error = function(err) {
    console.error(err);
    return log;
  };
  log.log = function() {
    return log;
  };
  log.group = function() {
    return log;
  };
  return log;
}
