/**
 * batch-parse - batches should return an array of bridge functions to run
 *
 * @param  {string} batchName name of the batch (for logging/output folder)
 * @param  {string} batchFile path of the json batch file
 * @return {array}           array of Bridge instances
 */
module.exports = (batchName, batchFile) => {
  const batch = require(batchFile)
  const Bridge = require('./bridge')
  const config = require('../config.json')

  class Script {
    constructor({config, opt}) {
      this.config = config
      this.opt = opt
      this.opt.cfg = config
      this.script = require(config.dirs.input + opt.name)
    }
    run(callback) {
      this.script(this.config, this.opt, callback)
    }
  }

  return batch.map((b) => {
    let o = Object.assign({}, {
      type: 'bridge',
      task: true,
      batch: batchName
    }, b)
    if (o.type === 'script') return new Script({config: config, opt: o})
    return new Bridge({config: config, opt: o})
  })
}
