module.exports = (opt, columns, moduleCallback) => {

  //file locations
  let dt = new Date()
  let dir = dt.getFullYear() + '-' + ('0' + (Number(dt.getMonth()) + 1).toString()).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2)

  const table = opt.source + '.' + opt.table
  const fs = require('graceful-fs')
  const mkdirp = require('mkdirp')
  const outputFile = `${opt.cfg.dirs.output}xlsx/${dir}/${table}.xlsx`
  const XLSX = require('xlsx')

  XLSX.cellDates = true

  //read tsv file
  let wb = XLSX.readFile(/*opt.opfile.filename*/'./local/input/tsv/SHORT_MOCK.txt', {
    FS: '\t',
    cellDates: true
  })
  let worksheet = wb.Sheets['Sheet1']

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
    let hdr = "UNKNOWN " + C
    if (cell && cell.t) {
      worksheet[v].v = worksheet[v].v.replace(/_IND|_DEC/, '')
      hdr = XLSX.utils.format_cell(cell)
    }
    headers.push(hdr)
  }

  //mkdirp and write file
  mkdirp(opt.cfg.dirs.output + 'xlsx/' + dir, (e) => {
    if (e) return moduleCallback(e)
    XLSX.writeFile(wb, outputFile, {cellDates: true})
    moduleCallback(null, range.e.r, headers)
  })

}
