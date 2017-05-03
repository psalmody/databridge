module.exports = (opt, moduleCallback) => {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source)

  const XLSX = require('xlsx')
  const file = opt.table
  const filename = `${opt.cfg.dirs.input}xlsx/${file}.xlsx`
  const log = opt.log
  const opfile = opt.opfile
  const async = require('async')

  let workbook = XLSX.readfile(opt.table)

  let worksheet = workbook.Sheets[workbook.SheetNames[0]]

  let output = XLSX.utils.sheet_to_csv(worksheet, {
    FS: '\t'
  })

  console.log(worksheet['!cols'])

  opfile.append(output, (e)=> {
    if (e) {
      log.error(e)
      return moduleCallback(e)
    }
    moduleCallback(null)
  })

}
