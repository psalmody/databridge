module.exports = (opt, moduleCallback) => {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source)

  const file = opt.table
  const filename = `${opt.cfg.dirs.input}${opt.source}/${file}.json`
  const opfile = opt.opfile
  const async = require('async')

  let data = require(filename)

  let wStream = opfile.writeStream

  //write columns
  wStream.write(Object.keys(data[0]).join('\t') + '\n')
    //write data
  async.times(data.length, (n, next) => {
    wStream.write(Object.keys(data[n]).map((k) => data[n][k]).join('\t') + '\n', 'utf8', (e) => {
      if (e) return next(e)
      next()
    })
  }, (e) => {
    if (e) return moduleCallback(e)
    let columns = Object.keys(data[0])
    moduleCallback(null, data.length, columns)
  })
}
