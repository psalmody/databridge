/**
 * bin/list-batches - get list of available batches
 *
 * @return {array}  list of available batches
 */
module.exports = () => {
  const fs = require('fs')
  const config = require('../config')
  const {removeFileExtension} = require('./string-utilities')
  const files = fs.readdirSync(config.dirs.batches).filter(f => f.indexOf('.') !== 0)
  return files.map(f => removeFileExtension(f))
}
