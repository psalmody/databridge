module.exports = (opt, moduleCallback) => {
  if (typeof(opt.table) == 'undefined') return moduleCallback('Table required for ' + opt.source)

  const XLSX = require('xlsx')
  const file = opt.table
  const filename = `${opt.cfg.dirs.input}xlsx/${file}.xlsx`
  const log = opt.log
  const opfile = opt.opfile

  let workbook = XLSX.readFile(filename)

  let worksheet = workbook.Sheets[workbook.SheetNames[0]]

  let output = XLSX.utils.sheet_to_csv(worksheet, {
    FS: '\t',
    cellDates: true
  })

  //get header row
  let headers = []
  let range = XLSX.utils.decode_range(worksheet['!ref'])

  let C
  let R = range.s.r /* start in the first row */

  //loop through first row
  for (C = range.s.c; C <= range.e.c; ++C) {
    let v = XLSX.utils.encode_cell({
      c: C,
      r: R
    })
    let cell = worksheet[v]
    let hdr = 'UNKNOWN ' + C
    if (cell && cell.t) {
      worksheet[v].v = worksheet[v].v.replace(/_IND|_DEC/, '')
      hdr = XLSX.utils.format_cell(cell)
    }
    headers.push(hdr)
  }

  opfile.append(output, (e) => {
    if (e) {
      log.error(e)
      return moduleCallback(e)
    }
    moduleCallback(null, range.e.r, headers)
  })

}
