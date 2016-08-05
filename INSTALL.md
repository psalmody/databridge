# INSTALLATION

## Local folder setup

Use the `local` directory or copy it to a different location on your machine where you'd like to have data stored.

## Database setup

### Oracle

See [oracledb INSTALL](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md) for installation.

Once `oracledb` install completed, added to this package with `npm install oracledb`.

Add a file `oracle.js` in the local/creds folder with the following format:

```js
module.exports = {
  user: 'username',
  password: 'password',
  connectString: '(DESCRIPTION =   (ADDRESS_LIST =      (ADDRESS = (PROTOCOL = TCP)(HOST = host.com)(PORT = 1541))    )    (CONNECT_DATA =      (SERVICE_NAME = host.com)    ))'
}
```

### MySQL / MongoDB / SQL Server

This module comes with scripts for running OracleDB, SQL Server, MySQL and MongoDB data requests. You may want to remove `package.json` dependencies for SQL Server / MySQL or MongoDB for space / time considerations.

Create credentials files in the `local/creds` folder for any databases desired with the following formats:

#### MySQL

Filename: `mysql.js`.

```js
module.exports = {
  host: 'localhost',
  user: 'username',
  password: 'password'
}
```

#### SQL Server

Filename: `mssql.js`.

```js
module.exports = {
  user: 'username',
  password: 'password',
  server: 'localhost',
  port: 53965,
  domain: 'DOMAIN',
  encrypt: false,
  requestTimeout: 60000
}
```

#### MongoDB

Filename: `mongo.js`.

```js
module.exports = 'mongodb://username:password@localhost:27017/' //mongodb connect string
```

## Finish install

Clone the project and install / run setup:

```
git clone https://github.com/psalmody/databridge.git
cd databridge
npm install
```

Put data files or queries in `config.dirs.input` in a directory named after the source.

E.g. `<...>/local/mssql/query.sql`

## Configuration Defaults

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
  "logto": "console", //console or file
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
