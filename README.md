[![npm](https://img.shields.io/npm/dt/databridge.svg?maxAge=2592000)](https://www.npmjs.com/package/databridge)
[![Github All Releases](https://img.shields.io/github/downloads/psalmody/databridge/total.svg?maxAge=2592000?style=flat-square)](https://github.com/psalmody/databridge)
[![GitHub stars](https://img.shields.io/github/stars/psalmody/databridge.svg?style=social&label=Star&maxAge=2592000?style=flat-square)](https://github.com/psalmody/databridge)
[![Twitter Follow](https://img.shields.io/twitter/follow/psalmody.svg?style=social&label=Follow&maxAge=2592000?style=flat-square)](https://twitter.com/psalmody)

# DataBridge

A framework for automated and programmatic data transfer. Separate source
and destination modules allow for a high degree of customization and
deployment-specific data handling.

## Installation

See [INSTALL](https://github.com/psalmody/databridge/blob/master/INSTALL.md).

## Node usage

```shell
npm install databridge --save
```

In node:
```
var databridge = require('databridge');
```

See `index.js` for exposed models.

## <a name="clusage"></a> Command-Line Usage

Run bridge or batch. In project directory at command-line:

```shell
node app --help
npm start -- --help
```

Re-setup:

```
node setup
```

Cleanup any extraneous output files (make appropriate backups first). Takes `-d` flag for number of previous days' files to keep.

```
node clean
node clean -d 3
node clean -d 0
```

Manage bind variables. Follow prompts:

```
node bind
```

## Data Types

Data type detection is handled by `typeof()` and a combination of
source column strings.

1. `GPA` anywhere or `_DEC` at the end of the column name will be parsed as `DECIMAL(8,2)`. (`_DEC` will be removed from the destination column name.)
2. `DATE` or `TIMESTAMP` in the column name is parsed as `DATE`.
3. For all other types, the first row of data will be used.
  1. If `typeof(value) == 'number'` parsed as `INT`.
  2. Else parsed as `VARCHAR(255)`

This behavior is run by `bin/col-parser` and should be customized for
particular situations especially involving large amounts of data.

## Indexes

For SQL-based destinations, indexes are created for column names with the
trailing string `_IND`. This trailing string is removed from the destination
column name.

## Running as a Service / PM2

Uses `config.schedule` file and can setup service. Requires [pm2](http://pm2.keymetrics.io/) installed globally `npm install -g pm2`.

```shell
# start pm2 service
npm run service-start
# restart pm2
npm run service-restart
# stop pm2
npm run service-stop
```

It is possible to [run pm2 at startup](http://pm2.keymetrics.io/docs/usage/startup/).

### Schedule Configuration

Each schedule object requires `type` attribute: `bridge` or `batch`.

> NOTE: When using the service, it cannot prompt for bind variables if
> needed. Therefore, any sources that require bind variables will throw
> an error if bind variables are not defined. Each job object in that case
> MUST have a `binds: true` or defined `binds: {...}` attribute.

Each schedule object requires `cron` attribute in the following format:

```
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    |
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, optional)
```

Example `schedule.json` file:

```json
[{
  "name": "test",
  "type": "batch",
  "cron": "*/30 * * * *"
}, {
  "type": "bridge",
  "name": "oracle employees.ferpa_certified => mssql",
  "cron": "*/10 * * * *",
  "binds": true,
  "source": "oracle",
  "destination": "mssql",
  "table": "employees.ferpa_certified"
}, {
  "type": "bridge",
  "name": "mssql surveys.population_open => csv",
  "cron": "*/20 * * * *",
  "binds": true,
  "source": "mssql",
  "table": "surveys.population_open",
  "destination": "csv"
}, {
  "type": "bridge",
  "name": "xlsx employees.ferpa_certified => mssql",
  "cron": "*/25 * * * *",
  "binds": true,
  "source": "xlsx",
  "destination": "mssql",
  "table": "employees.ferpa_certified"
}, {
  "type": "script",
  "name": "name of script inside input directory, file extension",
  "cron": "0 1 * * *"
}]
```

## Testing

Install Mocha globally:
```shell
npm install -g mocha
```

All tests:
```shell
npm test
```

All destinations or sources:
```shell
mocha spec/destinations
mocha spec/sources
```

Just one destination/source:
```shell
mocha spec/destinations --one=mssql
mocha spec/sources --one=mysql
```

## Customizing sources / destinations

### Source modules

Source modules are passed the config/opt object from the bridge.

Source modules MUST return:

1. `null` or error.
2. Number of rows pulled from source.
3. Array of column names from source.

### Destination modules

Destination modules are passed config/opt object from the bridge
and the columns definitions generated by `bin/col-parser`.

Destination modules MUST return:

1. `null` or error.
2. Number of rows written to destination.
3. Array of column names at destination.
