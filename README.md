# DataBridge
------------

A framework for automated and programatic data transfer. Separate source
and destination modules allow for a high degree of customization and
deployment-specific data handling.

## Installation

Clone the project:

```shell
git clone https://gitlab.com/databridge/databridge.git
```

Open a terminal/command prompt in the new directory and run the install script. Follow the prompts.

```shell
node setup
```

Install source/destination modules as needed.

```shell
npm install databridge-source-mssql
```

### Configuration Defaults

```js
{
  "dirs": {
    "batches": "c:/databridge/local/batches/",
    "creds": "c:/databridge/local/creds/",
    "destinations": "c:/databridge/local/destinations/",
    "input": "c:/databridge/local/input/",
    "logs": "c:/databridge/local/logs/",
    "output": "c:/databridge/local/output/",
    "sources": "c:/databridge/local/sources/"
  },
  "logto": "console", //if console, uses log-dev, otherwise regular log
  "defaultBindVars": {
    ... //system-wide defaults for query bind variables
  },
  "schedule": "c:/databridge/local/schedule.json",
  "service": {
    "name": "dataBridge", //name of the service
    "log": "c:/databridge/local/logs/schedule.log.txt"
  }
}
```

## <a name="clusage"></a> Command-Line Usage

In project directory at command-line:

```shell
node app --help
```

## Bridge module

The bridge module `bin/bridge` takes various options and connects the source and destination modules. Required options are:

```json
{
  "source": "...",
  "table": "...",
  "destination": "..."
}
```

Any additional options are passed to the source and destinations modules.

## Source modules

Source modules are passed the config/opt object from the bridge.

Source modules MUST return:

1. `null` or error.
2. Number of rows pulled from source.
3. Array of column names from source.

## Destination modules

Destination modules are passed config/opt object from the bridge
and the columns definitions generated by `bin/col-parser`.

Destination modules MUST return:

1. `null` or error.
2. Number of rows written to destination.
3. Array of column names at destination.

## Data Types

Data type detection is handled by `typeof()` and a combination of
source column strings.

1. `GPA` anywhere or `_DEC` at the end of the column name will be parsed as `DECIMAL(8,2)`. (`_DEC` will be removed from the destination column name.)
2. `DATE` or `TIMESTAMP` in the column name is parsed as `DATE`.
3. For all other types, the first row of data will be used.
  1. If `typeof(value) == 'number'` parsed as `INT`.
  2. Else parsed as `VARCHAR(255)`

This behavior is run by `bin\col-parser` and should be customized for
particular situations especially involving large amounts of data.

## Indexes

For SQL-based destinations, indexes are created for column names with the
trailing string `_IND`. This trailing string is removed from the destination
column name.

## Running as a Service

Uses `config.schedule` file and can setup service.

### Setup

In project directory at command-line:

```shell
node bin/schedule --help
```

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
}]
```
