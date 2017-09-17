/**
 * bin/list-dest - lists installed destinations
 *
 * @param  {object} cfg config.json
 * @return {array}     available destinations
 */
module.exports = function(cfg) {
  const fs = require('fs')
  const i = fs.readdirSync('./bin/dest').filter(f => f.indexOf('.') !== 0)
  const l = fs.readdirSync(cfg.dirs.destinations).filter(f => f.indexOf('.') !== 0)

  const {removeFileExtension} = require('./string-utilities')

  let a = cfg.TESTING == true ? i : i.concat(l);

  let s = []
  a.forEach(v => {
    v = removeFileExtension(v)
    if (s.indexOf(v !== -1)) s.push(v)
  })
  return s
}
