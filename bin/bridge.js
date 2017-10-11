
const Timer = require('./timer')
const {Spinner} = require('cli-spinner')
const OutputFile = require('./output-file')
const colParser = require('./col-parser')
const async = require('async')

class Bridge {
  constructor({config, opt}) {
    const {bin, task, binds, source, destination} = opt
    this.logto = config.logto || 'console'
    this.cfg = config
    this.opt = opt
    this.opt.cfg = config
    this.opt.bin = __dirname.replace(/\\/g, '/') + '/'
    this.opt.timer = new Timer()
    this.opt.spinner = (task) ? false : (() => {
      const s = new Spinner('processing... %s')
      s.setSpinnerString(0)
      return s
    })()
    this.opt.log = require('./log-' + this.logto)(opt)
    this.response = require(this.opt.bin + 'response')(this.opt)
    this.response.binds = this.binds
    this.source = require('./src/' + source) || require(cfg.dirs.sources + source)
    this.destination = require('./dest/' + destination) || require(cfg.dirs.destinations + destination)
  }
  get binds() {
    return this.opt.binds
  }
  run(callback) {
    this.opt.opfile = new OutputFile(this.opt)
    const runSource = (callback) => {
      if (this.spinner) this.spinner.start()
      this.response.source.start()
      this.source(this.opt, (e, rows, columns) => {
        this.response.source.stop()
        if (e) {
          this.response.source.error(e)
          return callback(e)
        }
        this.response.source.respond('ok', rows, columns)
        if (rows === 0) return callback('No data returned from source.')
        callback(null)
      })
    }
    const runColumns = (callback) => {
      colParser(this.opt.opfile, (err, parsedCols) => {
        if (err) return callback(err)
        this.parsedCols = parsedCols
        callback(null)
      })
    }
    const runDestination = (callback) => {
      this.response.destination.start()
      this.destination(this.opt, this.parsedCols, (err, rows, columns) => {
        this.response.destination.stop()
        if (err) {
          this.response.destination.error(err)
          return callback(err)
        }
        this.response.destination.respond('ok', rows, columns)
        callback(null)
      })
    }
    const cleanupOutput = (callback) => {
      try {
        this.opt.opfile.clean()
      } catch(e) {
        if (typeof(this.opt.opfile) !== 'undefined') this.opt.log.error(e)
        return callback(e)
      }
      callback(null)
    }
    async.waterfall([runSource, runColumns, runDestination, cleanupOutput], (e) => {
      if (e) {
        this.opt.log.error(e)
        this.opt.log.error(this.opt.timer.str)
        if (this.opt.spinner) this.opt.spinner.stop(true)
        return callback(e)
      }
      //success
      this.opt.log.group('Finished bridge').log(this.opt.timer.str)
      this.opt.log.log(`Completed ${this.opt.source} ${this.opt.table} to ${this.opt.destination}.`)
      this.opt.log.log(JSON.stringify(this.response.strip(), null, 2))
      if(this.opt.spinner) this.opt.spinner.stop(true)
      return callback(this.response.check(), this.response)
    })
  }
}

//now run
module.exports = Bridge
