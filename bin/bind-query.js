module.exports = function(query, opt, moduleCallback) {
  //read query, check binds, prompt or use defBinds

  var qBinds = [],
    //remove comments
    sql = query.replace(/\/\*[.\s\S]*?\*\/|--.*?[\n\r]/g, ''),
    //find binds
    //bindPattern = /[:].[a-z_0-9]+/g;
    //now bind pattern ignores : inside quotes (date formats)
    bindPattern = /[:].[A-Za-z_0-9]+(?=([^']*'[^']*')*[^']*$)/g,
    //extend config binds with any attached to opt
    defBinds = Object.assign({}, opt.cfg.defaultBindVars, opt.binds),
    spinner = opt.spinner;

  while (result = bindPattern.exec(sql)) {
    var r = result[0].replace(':', '');
    if (qBinds.indexOf(r) == -1) qBinds.push(r);
  }

  function replaceBinds(query, binds) {
    for (var i = 0; i < qBinds.length; i++) {
      try {
        //try replacing all binds with default
        query = query.replace(new RegExp(':' + qBinds[i], "g"), binds[qBinds[i]]);
      } catch (e) {
        return moduleCallback('Problem finding bind for "' + r + '"' + e);
      }
    }
    return query;
  }

  //return formatted query
  if (opt.binds) return moduleCallback(null, replaceBinds(sql, defBinds), defBinds);

  //if not using defBinds, prompt
  var prompt = require('prompt'),
    colors = require('colors'),
    prompts = {
      properties: {

      }
    };

  prompt.message = colors.green('Enter bind variable');

  for (var i = 0; i < qBinds.length; i++) {
    prompts.properties[qBinds[i]] = {
      default: defBinds[qBinds[i]],
      description: colors.green(qBinds[i])
    }
  }

  if (spinner) spinner.stop(true);
  prompt.start();
  prompt.get(prompts, function(err, result) {
    if (err) return moduleCallback(err);
    if (spinner) spinner.start();
    moduleCallback(null, replaceBinds(sql, result), result);
  });
}
