//insert data into MongoDB
module.exports = function(options, opfile, columns, log, timer, moduleCallback) {

  var fs = require('fs'),
    async = require('async');

  var client = require('mongodb').MongoClient,
    creds = require('../../creds/mongo'),
    db,
    collection,
    Stream = require('stream'),
    split = require('split');

  const table = options.table.indexOf('.') > -1 ? options.table : 'dbutil.' + options.table;
  const databaseName = table.split('.')[0];
  const collectionName = table.split('.')[1];

  async.waterfall([
    function(cb) {
      client.connect(creds + databaseName, function(err, database) {
        if (err) return cb(err);
        db = database;
        log.group('MongoDB').log('Connected');
        cb(null);
      })
    },
    function(cb) {
      db.createCollection(collectionName, function(err, coll) {
        if (err) return cb(err);
        collection = coll;
        log.log('Created connection (if not existing) ' + collectionName);
        cb(null);
      })
    },
    function(cb) {
      if (options.update) {
        log.log('Insert only - not dropping existing data.');
        return cb(null);
      }
      //delete old data
      collection.deleteMany({}, function(err, results) {
        if (err) return cb(err);
        log.log('Deleted old data rows: ' + results.result.n);
        cb(null);
      })
    },
    function(cb) {
      //insert data one row at a time
      var first = true;
      var mongoWriteStream = new Stream.Writable();
      var rowCount = 0;
      mongoWriteStream._write = function(chunk, encoding, callback) {
        //write every line
        var data = chunk.toString().split('\t');
        var doc = {};
        //parse types
        for (var i = 0; i < columns.length; i++) {
          if (!isNaN(Number(data[i]))) {
            doc[columns[i].name] = Number(data[i]);
          } else if (data[i] === 'true') {
            doc[columns[i].name] = true;
          } else if (data[i] === 'false') {
            doc[columns[i].name] = false;
          } else if (
            columns[i].name.toUpperCase().indexOf('DATE') !== -1 || columns[i].name.toUpperCase().indexOf('TIMESTAMP') !== -1 || columns[i].name.toUpperCase().indexOf('DATETIME') !== -1
          ) {
            doc[columns[i].name] = new Date(data[i]);
          } else {
            doc[columns[i].name] = data[i];
          }
        }
        if (data.length !== columns.length) return callback();
        //console.log(doc);
        collection.insertOne(doc, function(err, result) {
          if (err) throw err;
          rowCount++;
          callback();
        });

      }
      mongoWriteStream.on('error', function(err) {
        cb(err);
      });
      mongoWriteStream.on('finish', function() {
        cb(null, rowCount);
      })
      var opfileRStream = opfile.createReadStream();
      opfileRStream.pipe(split()).pipe(mongoWriteStream);
    },
    function(rowCount, cb) {
      collection.count(function(err, count) {
        log.log('Success! Inserted ' + rowCount + ' documents. MongoDB says ' + databaseName + '.' + collectionName + ' now has ' + count + ' docs.');
        cb(null);
      })
    }
  ], function(err) {
    try {
      db.close();
    } catch (e) {
      log.error(e);
    }
    if (err) return moduleCallback(err);
    log.group('Finished destination').log(timer.now.str());
    moduleCallback(null, opfile);
  })

}
