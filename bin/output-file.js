/**
 * handles the output file created for data between
 * source and destination
 */

const fs = require('fs')

class OutputFile {
  //set filename and create file
  constructor(opt) {
    const dir = opt.cfg.dirs.output
    this.filename = `${dir}${opt.table}.${Date.now()}.dat`
    fs.openSync(this.filename, 'w')
    return;
  }
  //remove file - cleanup
  clean(callback = () => {return}) {
    fs.unlink(this.filename, (err) => {
      return (err) ? callback(err) : callback(null, true)
    })
  }
  //append stuff to file
  append(data, callback = () => {return}) {
    fs.appendFile(this.filename, data, (err) => {
      return (err) ? callback(err) : callback(null)
    })
  }
  //get first two lines
  twoLines(callback) {
    fs.readFile(this.filename, 'utf-8', (err, data) => {
      return (err) ? callback(err) : callback(null, data.replace(/\r/g, '').split('\n').slice(0,2))
    })
  }
  //sample 100 lines
  sampleLines(callback) {
    fs.readFile(this.filename, 'utf-8', (err, data) => {
      if (err) return callback(err)
      let lines = data.replace(/\r/g, '').split('\n')
      const times = Math.min(lines.length - 1, 100)
      let returnArray = []
      for(let i = 0; i < times; i++) {
        returnArray.push(lines[Math.floor(Math.random() * (lines.length - 1)) + 2])
      }
      callback(null, returnArray, lines[0].split('\t'))
    })
  }
  get writeStream() {
    return fs.createWriteStream(this.filename)
  }
  get readStream() {
    return fs.createReadStream(this.filename)
  }
}

module.exports = OutputFile
