var Timer = function() {


  var timer = this;
  timer.start = Date.now();

  timer.now = {
    sec: function() {
      return seconds(Date.now() - timer.start);
    },
    min: function() {
      return minutes(Date.now() - timer.start);
    },
    str: function() {
      return "Since timer start: " + timer.now.sec() + " seconds / " + timer.now.min() + " minutes.";
    }
  }

  function seconds(t) {
    return (t / 1000).toFixed(2);
  }

  function minutes(t) {
    return (t / 1000 / 60).toFixed(2);
  }

}

module.exports = new Timer();
