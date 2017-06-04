//development environment log - just log to console
//rather than a log file - see bin/log for more details
//about this module's setup
module.exports = (opt) => {
  const spinner = opt.spinner
  const colors = require('colors')

  return {
    g: '',
    filename: false,
    error: (err = '') => {
      if (spinner) spinner.stop(true)
      console.log(colors.red(err))
      if (spinner) spinner.start()
      return this
    },
    log: (msg = '') => {
      if (spinner) spinner.stop(true)
      console.log(this.g + ': ' + msg)
      if (spinner) spinner.start()
      return this
    },
    group: (str = '') => {
      this.g = str
      return this
    }
  }
}
