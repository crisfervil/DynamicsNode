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

// Instantiate CRMClient using a valid CRM connection string
// https://msdn.microsoft.com/en-us/library/gg695810.aspx
var crm = new CRMClient("Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode");

var who = crm.WhoAmI();
var myUser = crm.retrieve("systemuser",who);
console.log(myUser);

var account = crm.retrieve("account","4C1ECDF4-633B-E211-9EB5-0050568A69E2");
console.log(account);
```

Replace the connection string for your CRM server values.

More information about the connection string options: https://msdn.microsoft.com/en-us/library/gg695810.aspx

Save the file and run the script.

In order to run the script use node
```
$ node myscript
```
# How to run tests
Requires mocha to run the tests (https://mochajs.org/)

```
$  mocha --recursive
```
