/**
 * Timer module to be passed between source and destination
 * in order to time entire process.
 */
var Timer = function() {

  var timer = this;
  timer.s = Date.now();

  //get current timer
  timer.now = {
    sec: function() {
      return seconds(Date.now() - timer.s);
    },
    min: function() {
      return minutes(Date.now() - timer.s);
    },
    str: function() {
      return "Since timer start: " + timer.now.sec() + " seconds / " + timer.now.min() + " minutes.";
    }
  }

  //get timer start
  timer.start = function() {
    return timer.s.toString();
  }

  function seconds(t) {
    return (t / 1000).toFixed(2);
  }

  function minutes(t) {
    return (t / 1000 / 60).toFixed(2);
  }

}

module.exports = new Timer();
