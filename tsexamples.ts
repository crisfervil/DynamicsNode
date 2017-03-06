import {CRMClient}  from "./src/CRMClient";
import {DataTable}  from "./src/DataTable";
import {DataTableSerializer}  from "./src/DataTableSerializer";

//var crm = new CRMClient("default");
var crm = new CRMClient("Url=http://crm.contoso.com/xrmContoso");

var who = crm.whoAmI();
console.log(who);

var myUser = crm.retrieve("systemuser",who);
console.log(myUser);

var account1 = crm.retrieve("account","4C1ECDF4-633B-E211-9EB5-0050568A69E2",["accountid","name","ownerid","createdon"]);
console.log(account1);

var account2 = crm.retrieve("account","4C1ECDF4-633B-E211-9EB5-0050568A69E2");
console.log(account2);

var guid = crm.create("account",{name:"test account", description:"this is a test"});
console.log("created account with id " + guid);
crm.delete("account",guid);

//var guid = crm.create("account",[{name:"account1"},{name:"account2"}]);

for(var i=0;i<10;i++){
  guid = crm.create("account",{name:"test account "+i, description:"this is a test",AccountCategoryCode:1});
  console.log("created account with id " + guid);
  crm.delete("account",guid);
}

var accounts = DataTableSerializer.load("accounts.xml");
//crm.create("account",accounts.rows);

var contacts = DataTableSerializer.load("contacts.xml");

// Perform some transformations before insert
//contacts.lookup("accountid", row => crm.retrieve("account",{name:row.accountid}).accountid);
// The User ID is not the same, so we need to get the existing one
//contacts.lookup("ownerid", row => crm.retrieve("systemuser",{domainname:row.ownerid}).systemuserid);

//crm.create("contacts",contacts.rows);

//crm.fetchAll("accounts").save("accounts.xml");

//crm.fetchAll("accounts").save("accounts.json");

crm.update("account",{accountid:"2ad7a34f-11db-4910-8f1c-397b1352f0e3",name:"updated"});
crm.update("account",{name:"updated"},{name:{like:"%test%"}});


// Export the list of attributes of an entity to an excel file
var dn = require("dynamicsnode");

// set the environment where to execute this script
crm = new dn.CRMClient("UAT"); 

// Get the entity metadata
var entityName = "account";
var metadata = crm.getEntityMetadata(entityName);

var outputTable = new dn.DataTable();

for (var i = 0; i < metadata.Attributes.length; i++) {
    var attr = metadata.Attributes[i];
    outputTable.rows.push({name:attr.LogicalName,type:attr.AttributeType});
    console.log(attr.LogicalName);
}

// save the results to an external excel file
dn.DataTableSerializer.save(outputTable, `${entityName}Attributes.xlsx`);