module.exports = (opt, columns, moduleCallback) => {

  let dt = new Date()
  let dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2)

  const table = opt.source + '.' + opt.table
  const fs = require('graceful-fs')
  const mkdirp = require('mkdirp')
  const outputFile = `${opt.cfg.dirs.output}xlsx/${dir}/${table}.xlsx`
  const XLSX = require('xlsx')

  let wb = XLSX.readFile(opt.opfile.filename, {FS: '\t'})
  let worksheet = wb.Sheets['Sheet1']

  console.log(wb.SheetNames)



  mkdirp(opt.cfg.dirs.output + 'xlsx/' + dir, (e) => {
    if (e) return moduleCallback(e)
    XLSX.writeFile(wb, outputFile)
    moduleCallback(null)
  })

}
