module.exports = function(query, defaults, usedefaults, spinner, callback) {
  //read query, check binds, prompt or use defaults


  var bds = [],
    //remove comments
    sql = query.replace(/\/\*[.\s\S]*?\*\/|--.*?[\n\r]/g, ''),
    //find binds
    bindPattern = /[:].[a-z_0-9]+/g;

  while (result = bindPattern.exec(sql)) {
    var r = result[0].replace(':', '');
    if (bds.indexOf(r) == -1) bds.push(r);
  }

  function replaceBinds(query, binds) {
    for (var i = 0; i < bds.length; i++) {
      try {
        //try replacing all binds with default
        query = query.replace(new RegExp(':' + bds[i], "g"), binds[bds[i]]);
      } catch (e) {
        return callback('Problem finding bind for "' + r + '"' + e);
      }
    }
    return query;
  }

  if (usedefaults) {
    //return formatted query
    return callback(null, replaceBinds(sql, defaults), defaults);
  }



  //if not using defaults, prompt

  var prompt = require('prompt'),
    colors = require('colors'),
    prompts = {
      properties: {

      }
    };

  prompt.message = colors.green('Enter bind variable');

  for (var i = 0; i < bds.length; i++) {
    prompts.properties[bds[i]] = {
      default: defaults[bds[i]],
      description: colors.green(bds[i])
    }
  }

  spinner.stop(true);
  prompt.start();
  prompt.get(prompts, function(err, result) {
    if (err) return callback(err);
    spinner.start();
    callback(null, replaceBinds(sql, result), result);
  });
}
