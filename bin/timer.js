/**
 * Timer module to be passed between source and destination
 * in order to time entire process.
 */
var Timer = function() {
  this.s = Date.now();
}

function seconds(t) {
  return (t / 1000).toFixed(2);
}

function minutes(t) {
  return (t / 1000 / 60).toFixed(2);
}

Timer.prototype.sec = function() {
  return seconds(Date.now() - this.s);
};

Timer.prototype.min = function() {
  return minutes(Date.now() - this.s);
};

Timer.prototype.str = function() {
  return "Since timer start: " + this.sec() + " seconds / " + this.min() + " minutes.";
}

Timer.prototype.start = function() {
  return timer.s.toString();
}

module.exports = Timer;
