module.exports = function(opt) {
  var obj = {
    source: {
      name: opt.source,
      table: opt.table,
      respond: function(status, rows, columns) {
        obj.source.response = status;
        obj.source.rows = rows;
        obj.source.columns = columns;
      },
      error: function(error) {
        obj.source.errorMsg = error;
      },
      start: function() {
        obj.source.st = Date.now();
      },
      stop: function() {
        obj.source.et = Date.now();
      },
      calcDuration: function() {
        return (obj.source.et - obj.source.st) / 1000;
      }
    },
    destination: {
      name: opt.destination,
      respond: function(status, rows, columns) {
        obj.destination.response = status;
        obj.destination.rows = rows;
        obj.destination.columns = columns;
      },
      error: function(error) {
        obj.destination.errorMsg = error;
      },
      start: function() {
        obj.destination.st = Date.now();
      },
      stop: function() {
        obj.destination.et = Date.now();
      },
      calcDuration: function() {
        return (obj.destination.et - obj.destination.st) / 1000;
      }
    },
    log: opt.log.filename,
    config: opt.cfg,
    check: function() {
      if (typeof(obj.source.errorMsg) !== 'undefined') return ["Source error.", obj.source.errorMsg];
      if (typeof(obj.destination.errorMsg) !== 'undefined') return ["Destination error.", obj.destination.errorMsg];
      if (typeof(obj.source.response) == 'undefined') return ["No response from source object."];
      if (typeof(obj.destination.response) == 'undefined') return ["No response from destination object."];
      if (obj.source.rows !== obj.destination.rows) return ["Row mismatch.", obj.source.rows, obj.destination.rows];
      var sCol = obj.source.columns.join('').replace(/_IND/gi, '');
      var dCol = obj.destination.columns.join('').replace(/_IND/gi, '');
      if (sCol !== dCol) return ["Column mismatch.", obj.source.columns, obj.destination.columns];
      //if no problems, return true
      return null;
    },
    strip: function() {
      //return this reponse object clean
      obj.checkDurations();
      var o = JSON.parse(JSON.stringify(obj));
      o.source.columns = typeof(o.source.columns) == 'undefined' ? null : o.source.columns.join(', ');
      o.destination.columns = typeof(o.destination.columns) == 'undefined' ? null : o.destination.columns.join(', ');
      delete o.source.st;
      delete o.source.et;
      delete o.destination.st;
      delete o.destination.et;
      return o;
    },
    checkDurations: function() {
      obj.source.duration = obj.source.calcDuration();
      obj.destination.duration = obj.destination.calcDuration();
    }
  }
  return obj;
}
