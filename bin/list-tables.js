/**
 * module - description
 *
 * @param  {string} source name of source
 * @return {array}        all available "tables" for source
 */
module.exports = (source) => {
  if (typeof(source) == 'undefined' || source.trim() == '') return 'Error. No source defined.';
  const fs = require('fs')
  const config = require('../config')
  const {removeFileExtension} = require('./string-utilities')

  return fs.readdirSync(config.dirs.input + source)
    .filter(f => f.indexOf('.') !== 0)
    .map(removeFileExtension)
}
