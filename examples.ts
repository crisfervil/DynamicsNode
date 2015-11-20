import {CRMClient}  from "./CRM/CRMClient";
import {DataTable}  from "./Data/DataTable";
import {Guid}  from "./CRM/Guid";


var crm = new CRMClient();
//var crm = new CRMClient({url:"http://myserver.com", userName:"test", password:"test"});

crm.retrieve("account",new Guid("2ad7a34f-11db-4910-8f1c-397b1352f0e3"));


crm.create("account",{name:"test"});
var guid = crm.create("account",[{name:"account1"},{name:"account2"}]);


for(var i=0;i<10;i++){
  crm.create("account",{name:"account"+i});
}

var accounts = DataTable.load("accounts.xml");
crm.create("account",accounts);

var contacts = DataTable.load("contacts.xml");

// Perform some transformations before insert
contacts.lookup("accountid", row => crm.retrieve("account",new Guid(row.accountid)));

crm.create("contacts",contacts);

crm.fetchAll("accounts").save("accounts.xml");
crm.fetchAll("accounts").save("accounts.json");

crm.update("account",{accountid:"2ad7a34f-11db-4910-8f1c-397b1352f0e3",name:"updated"});
crm.update("account",{name:{like:"%test%"}},{name:"updated"});
