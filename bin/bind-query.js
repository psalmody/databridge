module.exports = function(query, opt, moduleCallback) {


  //read query, check binds, prompt or use defBinds
  let qBinds = []
    //remove comments
  let sql = query.replace(/\/\*[.\s\S]*?\*\/|--.*?[\n\r]/g, '')
    //find binds
    //bindPattern = /[:].[a-z_0-9]+/g;
    //now bind pattern ignores : inside quotes (date formats)
  const bindPattern = /[:].[A-Za-z_0-9]+(?=([^']*'[^']*')*[^']*$)/g
    //extend config binds with any attached to opt
  const defBinds = Object.assign({}, opt.cfg.defaultBindVars, opt.binds)
  const spinner = opt.spinner

  //loop through query looking for binds
  let result
  while ((result = bindPattern.exec(sql))) {
    var r = result[0].replace(':', '');
    if (qBinds.indexOf(r) == -1) qBinds.push(r);
  }

  //if no binds in query, return the query file
  if (!qBinds.length) return moduleCallback(null, sql, defBinds);

  const replaceBinds = (query, binds) => {
    qBinds.forEach(v => {
      try {
        //try replacing all binds with default
        query = query.replace(new RegExp(':' + v, 'g'), binds[v]);
      } catch (e) {
        return moduleCallback('Problem finding bind for "' + r + '"' + e);
      }
    })
    return query;
  }

  //check to see if ALL binds are present in defBinds AND opt.binds is present
  if (opt.binds && qBinds.every(v => Object.keys(defBinds).indexOf(v) >= 0)) {
    //return formatted query
    var q = replaceBinds(sql, defBinds);
    return moduleCallback(null, q, defBinds);
  }

  //if not using defBinds, prompt
  const prompt = require('prompt')
  const colors = require('colors')
  let prompts = {
      properties: {

      }
    }

  prompt.message = colors.green('Enter bind variable')
  qBinds.forEach(b => {
    prompts.properties[b] = {
      default: defBinds[b],
      description: colors.green(b)
    }
  })

  if (spinner) spinner.stop(true)
  prompt.start()
  prompt.get(prompts, (err, res) => {
    if (err) return moduleCallback(err);
    if (spinner) spinner.start()
    moduleCallback(null, replaceBinds(sql, res), res);
  });
};
