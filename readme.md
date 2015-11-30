# Project description

Dynamics integration is a set of tools build on top of node.js that allows you to quickly create scripts to move data between Microsoft Dynamics CRM and other systems

# How to install

Create a new directory to store your scripts

```
$ mkdir MyScripts
```

Then cd into it
```
$ cd MyScripts
```

Install Dynamics Inegration
```
$  npm install dynamicsintegration
```
Create a new myscript.js file and start adding code

# How to use it

Edit the newly created file and add the following code

``` javascript

var CRMClient = new require("DynamicsIntegration").CRMClient;

var crm = new CRMClient("Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO");

var who = crm.whoAmI();
var myUser = crm.retrieve("systemuser",who);
console.log(myUser);

var mybu = crm.retrieve("businessunit",{businessunitid:myUser.businessunitid});
console.log(mybu);
```

Replace the connection string with your CRM server values.

More information about the connection string options: https://msdn.microsoft.com/en-us/library/gg695810.aspx

Save the file and run the script.

In order to run the script use node
```
$ node myscript
```
# CRMClient methods
## Constructor
``` ts
constructor(private connectionString?: string)
```
The connection string could be either a valid connection string or a name of an existing connection string in the file "config.json" at the root path.

The config.json file must be a valid json file, with a property named connectionStrings, with the following format.

``` json
{
	"connectionStrings":
	{
    "default":"Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode",
    "connection2":"Url=http://crm.contoso.com/xrmContoso"
	}
}
```
If no value is passed to the constructor, the "default" text will be assumed, which means that a connection string named "default" will be used.

Example:
``` js
var crm = new CRMClient("Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode");
```
Creates a connection using a valid Connection String

``` js
var crm = new CRMClient("connection2");
```
Creates a connection using the connection string named "connection2" specified in the config.json file

``` js
var crm = new CRMClient();
```
or

``` js
var crm = new CRMClient("default");
```
Creates a connection using the connection string named "default" specified in the config.json file


More information about the connection string options: https://msdn.microsoft.com/en-us/library/gg695810.aspx

## WhoAmI

Returns the GUID of the current user. Useful for testing the active connection.

Example:
``` js
var who = crm.whoAmI();
console.log(who);
```
outputs '6fefeb79-5447-e511-a5db-0050568a69e2'

## Retrieve
TBC

## Retrieve multiple
TBC

## Create
TBC

## Update
TBC

## Upsert
TBC

## Delete
TBC

# Repl integration
TBC

# Commands
TBC

## Export
```
$ di export systemuser users.xml
```

## Import
```
$ di import users.xml
```


# How to run tests
Requires mocha to run the tests (https://mochajs.org/)

```
$  npm test
```
