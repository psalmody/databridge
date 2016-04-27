# databridge - Data Bridging Framework

Module-based data bridging applications. Takes data from source modules, outputs temporarily as a tab-delimited file and then parses to destination modules.

`node app` provides a command-line interface for this utility. See [Command-Line Usage](#clusage) for more information.

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
