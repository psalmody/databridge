//insert data into MongoDB
module.exports = function(opt, columns, moduleCallback) {

  var fs = require('fs'),
    async = require('async');

  var client = require('mongodb').MongoClient,
    creds = require(opt.cfg.dirs.creds + 'mongo'),
    db,
    collection,
    Stream = require('stream'),
    split = require('split'),
    log = opt.log,
    timer = opt.timer,
    opfile = opt.opfile,
    cols = [];

  const table = opt.table.indexOf('.') > -1 ? opt.table : 'databridge.' + opt.table;
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
        if (opt.update) {
          log.log('Insert only - not dropping existing data.');
          return cb(null);
        }
        //delete old data
        db.listCollections({
          name: collectionName
        }).toArray(function(err, collections) {
          if (err) return cb(err);
          if (collections.length) {
            db.collection(collectionName).drop(function(err, results) {
              if (err) return cb(err);
              log.log('Deleted old collection.');
              cb(null);
            })
          } else {
            cb(null)
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
          cols.push(name);
          if (columns[i].index) {
            indexes.push(name);
          }
        }
        /* transform stream */
        mongoWriteStream._write = function(chunk, encoding, callback) {
          //skip first (columns)
          if (first) {
            first = false;
            return callback();
          }
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
          //skip blank lines
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
          cb(null, count);
        })
      }
    ],
    function(err, rows) {
      db.close(true, function(err) {
        if (err) moduleCallback(err);
      });
      try {
        db.close();
      } catch (e) {
        return moduleCallback(e);
      }
      if (err) return moduleCallback(err);
      log.group('Finished destination').log(timer.str());
      moduleCallback(null, rows, cols);
    })

}