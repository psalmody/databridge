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
      task: true
    }, b)
    return new Bridge({config: config, opt: o})
  })

  let bridges = []


  batch.forEach((options) => {
    //defaults for batch items - type: 'bridge' and task: true
    let o = Object.assign({}, {
        type: 'bridge',
        task: true
      }, options)
      //handle script type
    let fn = ((o) => {
        if (o.type == 'script') {
          return ((o) => {
            let script = require(config.dirs.input + o.name)
            return function(responses, cb) {
              script(config, o, function(err, response) {
                if (err) return cb(err)
                  //push clean version (no methods) of response
                responses.push(response)
                cb(null, responses)
              })
            }
          })(o)
        } else if (o.type == 'bridge') {
          return ((o) => {
            return function(responses, cb) {
              bridge(config, o, function(err, response) {
                if (err) return cb(err)
                  //push clean version (no methods) of response
                responses.push(response.strip())
                cb(null, responses)
              })
            }
          })(o)
        }
      })(o)
      //push into bridges array
    bridges.push(fn)
  })

  return bridges
}
