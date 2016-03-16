[![Build Status](https://travis-ci.org/crisfervil/DynamicsNode.svg?branch=master)](https://travis-ci.org/crisfervil/DynamicsNode) [![npm](https://img.shields.io/npm/v/dynamicsnode.svg)](https://www.npmjs.com/package/dynamicsnode)
# Project description

Dynamics Node is a library built on node.js that allows you to quickly create scripts to interact with Microsoft Dynamics CRM using javascript.

The main goal of Dynamics Node is to make you very productive when it comes to automate small tasks in Dynamics CRM. Just create a js file, add a few lines and execute it.

No more .net console application with all the boiler plate just for create one record. Go productive!

# How to use it
Create a new directory to store your scripts and cd into it

```
$ mkdir MyScripts && cd MyScripts
```

Install Dynamics Node
```
$  npm install dynamicsnode
```
## Writing code

Create a new js file named myscript.js and start adding code

``` javascript

var dn = require("DynamicsNode");

var crm = new dn.CRMClient("Url=http://crm.contoso.com/xrmContoso");

var who = crm.whoAmI();
var myUser = crm.retrieve("systemuser",who);
console.log(myUser);

var anotherUser = crm.retrieve("systemyser",{fullname:"John Doe"});
console.log(anotherUser);

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

**Further information:** [API](doc/api.md)

**How to compile and test the code:** [Compile and Testing](doc/CompileAndTesting.md)

**Use it as a command line tool:** [Commands and Repl](doc/CommandsAndRepl.md)


# Requirements
TBC

Requires [Node.js](nodejs.org)

This tool is based on [Edge](https://github.com/tjanczuk/edge) and requires .NET Framework 4.5 to be installed.

It has been tested in Windows environments only, but could potentially work in Linux too using Mono.

# Supported CRM versions
Tested on CRM 2011, 2011 and CRM Online so far.

Volunteers to run the integration tests on other versions are more than welcome :)


# Use it as an integration tests tool
TBC

# Use it as work load test tool
TBC


# Backlog
(Ordered by priority)

- [ ] *Improve documentation (work In progress)*
- [ ] *Add DataTable functions (work in progress)*
* [ ] *Improve testeability and integration tests (work in progress)* 
* [ ] *Add test coverage reports (work in progress)*
* [ ] Add import/export commands
* [ ] Add functions to work with solutions
* [ ] Add support for missing operators in condition objects
* [ ] Add integration tests for activities
- [x] ~~Upload npm package~~
