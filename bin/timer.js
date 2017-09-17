/**
 * Timer module to be passed between source and destination
 * in order to time entire process.
 */

class Timer {
  constructor() {
    this.s = Date.now()
  }
  get seconds() {
    return ((Date.now() - this.s) / 1000).toFixed(2)
  }
  get minutes() {
    return ((Date.now() - this.s) / 1000 /60).toFixed(2)
  }
  get str() {
    return `Since timer start: ${this.seconds} seconds / ${this.minutes} minutes`
  }
  get start() {
    return this.s.toString()
  }
}

module.exports = Timer
