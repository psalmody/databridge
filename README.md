# databridge - Data Bridging Framework

Module-based data bridging applications. Takes data from source modules, outputs temporarily as a tab-delimited file and then parses to destination modules.

`node app` provides a command-line interface for this utility. See [Command-Line Usage](#clusage) for more information.

## Installation

### Configuration

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
    ...
  },
  "schedule": "c:/databridge/local/schedule.json",
  "service": {
    "name": "dataBridge",
    "log": "c:/databridge/local/logs/schedule.log.txt"
  }
}
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

Source modules are passed the options object from the bridge, the command-line spinner (for starting and stopping) and a callback.

Source modules MUST return:

1. Output file instance which contains data from source.
2. Log instance for usage by the destination module.
3. Timer instance for logging and timing bridge process.

## Destination modules

Destination modules are passed:

1. Options from bridge.
2. Output file instance from source module which includes the data to be imported.
3. Columns objects - parsed from output file's first two lines by `bin/colParser` module within the bridge module.
4. Log instance from source module.
5. Timer instance from source module.

Destination modules MUST return the output file for cleanup in the bridge module.

## <a name="clusage"></a> Command-Line Usage

For help run `node app --help`.

## Running as a service

Uses `config.schedule` file and can setup service.

Each schedule object requires `type` attribute: `bridge` or `batch`.

> NOTE: Single bridge scheduled object MUST have `binds: true` OR `binds: {...}` otherwise it will cause an error and stop the service.

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
