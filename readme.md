# Project description

Dynamics integration is a set of tools build on top of node.js that allows you to quickly create scripts to move data between Microsoft Dynamics CRM and other systems

# How to install

```
$  npm install -g dynamicsintegration
```

Then, create a directory and start creating your scripts

# How to use it

``` javascript

var CRMClient = require("./CRM/CRMClient");
var Guid = require("./CRM/Guid");

// Instantiate CRMClient using a valid CRM connection string
// https://msdn.microsoft.com/en-us/library/gg695810.aspx
var crm = new CRMClient("Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode");

var who = crm.WhoAmI();
var myUser = crm.retrieve("systemuser",new Guid(who),true);
console.log(myUser);

var account = crm.retrieve("account",new Guid("4C1ECDF4-633B-E211-9EB5-0050568A69E2"),true/*all columns*/);
console.log(account);
```


In order to run the script use node
```
$ node myscript.js
```
