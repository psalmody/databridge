//insert data into MongoDB
module.exports = function(opt, moduleCallback) {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for source mysql.');

  var async = require('async'),
    client = require('mongodb').MongoClient,
    creds = require(opt.cfg.dirs.creds + 'mongo'),
    db,
    collection,
    opfile = opt.opfile,
    rowsProcessed = 0,
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
          cb(null);
        });
      },
      function(cb) {
        collection = db.collection(collectionName);
        collection.find({}).toArray(function(err, docs) {
          if (err) return cb(err);
          cb(null, docs);
        });
      },
      //TODO should append _IND or _DEC to columns with index or decimal?
      // or use Mongo query files?
      function(docs, cb) {
        //handle columns
        cols = Object.keys(docs[0]).filter(function(a) {
          return a !== '_id';
        });
        opfile.append(cols.join('\t') + '\n', function(err) {
          if (err) return cb(err);
          cb(null, docs);
        });
      },
      function(docs, cb) {
        //append data to output file
        var wStream = opfile.createWriteStream();
        docs.forEach(function(d) {
          var vals = [];
          for (var k in d) {
            vals.push(d[k]);
          }
          rowsProcessed++;
          wStream.write(vals.join('\t').replace(/\n|\r/g, '') + '\n');
        });
        cb(null, rowsProcessed);
      }
    ],
    function(err, rows) {
      try {
        db.close();
      } catch (e) {
        return moduleCallback(e);
      }
      if (err) return moduleCallback(err);
      moduleCallback(null, rows, cols);
    });
};
