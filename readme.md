[![Build Status](https://travis-ci.org/crisfervil/DynamicsNode.svg?branch=master)](https://travis-ci.org/crisfervil/DynamicsNode) [![codecov.io](https://codecov.io/github/crisfervil/DynamicsNode/coverage.svg?branch=master)](https://codecov.io/github/crisfervil/DynamicsNode?branch=master) [![npm](https://img.shields.io/npm/v/dynamicsnode.svg)](https://www.npmjs.com/package/dynamicsnode)
# Project description

Dynamics Node is a library built on node.js that allows you to quickly create scripts to interact with Microsoft Dynamics CRM using javascript.

The main goal of Dynamics Node is to make you very productive when it comes to automate small tasks in Dynamics CRM. Just create a js file, add a few lines and execute it.

No more .net console applications with all the boilerplate code just for creating one record. Go productive!

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
/// <reference path="node_modules/dynamicsnode/dynamicsnode.d.ts" />

var dn = require("dynamicsnode");

// update this with your CRM url and credentials if needed
var crm = new dn.CRMClient("Url=http://crm.contoso.com/xrmContoso"); 

// retrieve the current user
var who = crm.whoAmI();
var myUser = crm.retrieve("systemuser",who);
console.log(myUser);

// retrieve a user named John Doe
var anotherUser = crm.retrieve("systemuser",{fullname:"John Doe"});
console.log(anotherUser);

```

Save the file and run the script.

In order to run the script use node
```
$ node myscript
```

**Further information:** [API](doc/api.md)

**How to compile and test the code:** [Compile and Testing](doc/CompileAndTesting.md)

**Use it as a command line tool:** [Commands and Repl](doc/CommandsAndRepl.md)


# Requirements
Requires [Node.js](nodejs.org)

This tool is based on [Edge](https://github.com/tjanczuk/edge) and requires .NET Framework 4.5 to be installed.

It has been tested in Windows environments only, but could potentially work in Linux too using Mono.

# Supported CRM versions
Tested on CRM 2011, 2013 and CRM Online so far.

Volunteers to run the integration tests on other versions are more than welcome :)


# Backlog
(Ordered by priority)

* [ ] *Improve documentation (work In progress)*
* [ ] *Add DataTable functions (work in progress)*
* [ ] Add paging support in queries
* [ ] Add functions to work with solutions
* [ ] Add integration tests for activities
* [ ] Add a commands to work with connections
* [ ] Add more commands to repl mode
* [ ] Add support for missing operators in condition objects
* [ ] Add d.ts file to Typings repository 
* [x] ~~Improve testeability and integration tests~~
* [x] ~~Add import/export commands~~
* [x] ~~Add test coverage reports~~
* [x] ~~Upload npm package~~
