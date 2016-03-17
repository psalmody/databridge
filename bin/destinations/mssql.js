module.exports = function(file, callback) {

  var mssql = require('mssql'),
    creds = require('../../creds/mssql'),
    async = require('async'),
    mssql;


  var db = process.argv[2],
    table = process.argv[5];
  console.log(db);

  async.waterfall([
    //connect
    function(cb) {
      mssql.connect(creds).then(function() {
        console.log('connected to mssql');
        cb(null);
      }).catch(function(err) {
        cb(err);
      })
    },
    //create database if necessary
    function(cb) {
      new mssql.Request().query("if not exists(select * from sys.databases where name = '" + db + "') create database " + db).then(function(recordset) {
        console.log('created database (if not exists)');
        cb(null);
      }).catch(function(err) {
        cb(err);
      });
    }
  ], function(err) {
    mssql.close();
    if (err) {
      return callback(err);
    }
    callback();
  })
}
