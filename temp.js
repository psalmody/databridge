var fs = require('fs');

fs.readdir('./input/oracle/', function(err, dir) {
  if (err) return console.error(err);

  var mw = [];

  dir.forEach(function(query) {
    if (query.indexOf('mapworks.') !== -1) mw.push({
      "binds": true,
      "source": "oracle",
      "table": query.replace('.sql', ''),
      "destination": "mssql"
    })
  });

  fs.writeFileSync('./batches/mapworks.json', JSON.stringify(mw, null, 2));
})
