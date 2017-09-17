/**
 * batch-parse - batches should return an array of bridge functions to run
 *
 * @param  {string} batchName name of the batch (for logging/output folder)
 * @param  {string} batchFile path of the json batch file
 * @return {array}           array of bridge functions to run
 */
module.exports = (batchName, batchFile) => {
  const batch = require(batchFile)
  const Bridge = require('./bridge')
  const config = require('../config.json')

  return batch.map((b) => {
    let o = Object.assign({}, {
      type: 'bridge',
      task: true,
      batch: batchName
    }, b)
    return new Bridge({config: config, opt: o})
  })
}
