const program = require('commander')
const pkg = require('../package')

const newline = `
                                 `;

program.version(pkg.version)
  .usage(`[options] or npm start -- [options]`)
  .option(`-s, --source [source]`, `Specify source from bin/sources/. `)
  .option(`-t, --table [table]`, `Specify query or input file name (no file extension). ${newline}Try: -s <source> -h for a list of inputs.`)
  .option(`-d, --destination [destination]`, `Specify destination from bin/destinations/. `)
  .option(`-h, --show`, `Shows valid sources/destinations/tables.`)
  .option(`-b, --binds`, `Use default binds from input/binds.js rather than prompting ${newline}(applies to some sources only).`)
  .option(`-k, --task`, `This command is a schedule task or piping to output file.${newline}Don\`t generate processing spinner.`)
  .option(`-c, --batch [batch]`, `Run json [batch] from batches/`)
  .option(`-u, --update`, `Update table (insert data only) don\`t overwrite ${newline}existing table or update table structure ${newline}(for database destinations).`)
  .option(`-n, --truncate`, `Drop all values in table and insert new values, ${newline}don\`t drop table completely (for sql destinations only).`)
  .on(`--help`, function() {
    console.log(`  Examples:

    Run databridge for oracle query employees into mysql:
    > node app -s oracle -t employees -d mysql

    Show all valid sources:
    > npm start -- -hs

    Show all valid destinations:
    > node app -hd

    Run batch of data bridges:
    > node app --batch batchplease

    Show all valid tables for that source:
    > node app -s <source> -ht`)
  })
  .parse(process.argv)

module.exports = program
