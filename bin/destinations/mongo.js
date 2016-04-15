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
        //connect to mongo
        client.connect(creds + databaseName, function(err, database) {
          if (err) return cb(err);
          db = database;
          log.group('MongoDB').log('Connected');
          cb(null);
        })
      },
      function(cb) {
        //sometimes only insert, don't delete data
        if (options.update) {
          log.log('Insert only - not dropping existing data.');
          return cb(null);
        }
        //delete old data
        db.collectionNames(function(err, collections) {
          if (err) return cb(err);
          console.log(collections);
          if (collections) {
            db.collection(collectionName).drop(function(err, results) {
              if (err) return cb(err);
              log.log('Deleted old collection.');
              cb(null);
            })
          }
        })
      },
      function(cb) {
        //create colleciton (if not already existing)
        db.createCollection(collectionName, function(err, coll) {
          if (err) return cb(err);
          collection = coll;
          log.log('Created collection (if not existing) ' + collectionName);
          cb(null);
        })
      },
      function(cb) {
        //insert data one row at a time
        var first = true;
        var mongoWriteStream = new Stream.Writable();
        var rowCount = 0;
        var indexes = [];
        /* indexes */
        for (var i = 0; i < columns.length; i++) {
          //generate key and save for indexes
          var name = columns[i].name.replace(/_IND/ig, '');
          if (columns[i].index) {
            indexes.push(name);
          }
        }
        /* transform stream */
        mongoWriteStream._write = function(chunk, encoding, callback) {
          //write every line
          var data = chunk.toString().split('\t');
          var doc = {};
          //parse types
          for (var i = 0; i < columns.length; i++) {
            //parse data types
            if (!isNaN(Number(data[i]))) {
              doc[name] = Number(data[i]);
            } else if (data[i] === 'true') {
              doc[name] = true;
            } else if (data[i] === 'false') {
              doc[name] = false;
            } else if (
              name.toUpperCase().indexOf('DATE') !== -1 || name.toUpperCase().indexOf('TIMESTAMP') !== -1 || name.toUpperCase().indexOf('DATETIME') !== -1
            ) {
              doc[name] = new Date(data[i]);
            } else {
              doc[name] = data[i];
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
          cb(null, rowCount, indexes);
        })
        var opfileRStream = opfile.createReadStream();
        opfileRStream.pipe(split()).pipe(mongoWriteStream);
      },
      function(rowCount, indexes, cb) {
        //create indexes
        function makeIndex(i, callback) {
          log.log('makeIndex: ' + i);
          var ndex = {};
          ndex[i] = 1;
          collection.createIndex(ndex, null, function(err, results) {
            if (err) return callback(err);
            callback(null);
          })
        }
        //TODO not making indexes?? WHY??
        async.map(indexes, makeIndex, function(err, results) {
          if (err) return cb(err);

          cb(null, rowCount);
        })
      },
      function(rowCount, cb) {
        collection.count(function(err, count) {
          log.log('Success! Inserted ' + rowCount + ' documents. MongoDB says ' + databaseName + '.' + collectionName + ' now has ' + count + ' docs.');
          cb(null);
        })
      }
    ],
    function(err) {
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
