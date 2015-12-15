# Project description

Dynamics integration is a set of tools built on top of node.js that allows you to quickly create scripts to move data between Microsoft Dynamics CRM and other systems

# How to use it
Create a new directory to store your scripts

```
$ mkdir MyScripts
```

Then cd into it
```
$ cd MyScripts
```

Install Dynamics Integration
```
$  npm install dynamicsintegration
```
## Writing code

Create a new js file named myscript.js and start adding code

``` javascript

var CRMClient = require("DynamicsIntegration").CRMClient;

var crm = new CRMClient("Url=http://crm.contoso.com/xrmContoso");

var who = crm.whoAmI();
var myUser = crm.retrieve("systemuser",who);
console.log(myUser);

var mybu = crm.retrieve("businessunit",myUser.businessunitid);
console.log(mybu);
```

Replace the connection string with your CRM server values.

More information about the connection string options: https://msdn.microsoft.com/en-us/library/gg695810.aspx

Save the file and run the script.

In order to run the script use node
```
$ node myscript
```

**Further information:** [API](doc/Api.md)

**How to compile and test the code:** [Compile](doc/CompileAndTesting.md)

**Use it as a command line tool:** [Compile](doc/CommandsAndRepl.md)


# Requirements
TBC

Requires [Node.js](nodejs.org)

This tool is based on [Edge](https://github.com/tjanczuk/edge) and requires .NET Framework 4.5 to be installed.

# Supported CRM versions
Tested in CRM 2013 and CRM Online so far.

Volunteers to run the integration tests on other versions are more than welcome :)


# Use it as an integration tests tool
TBC

# Use it as work load test tool
TBC


# Backlog
(Ordered by priority)

* *Improve documentation (Work In Progress)*
* ~~Upload npm package~~
* Add DataTable functions
* ~~Add different Crm versions support~~
* ~~Improve integration tests~~
* Add test coverage reports
* Add SQL support
* Add import/expport commands
* Add functions to work with solutions
* Add support for missing operators in condition objects
