var CRMClient_1 = require("./CRM/CRMClient");
var DataTable_1 = require("./Data/DataTable");
var Guid_1 = require("./CRM/Guid");
var crm = new CRMClient_1.CRMClient();
crm.retrieve("account", new Guid_1.Guid("2ad7a34f-11db-4910-8f1c-397b1352f0e3"));
crm.create("account", { name: "test" });
var guid = crm.create("account", [{ name: "account1" }, { name: "account2" }]);
for (var i = 0; i < 10; i++) {
    crm.create("account", { name: "account" + i });
}
var accounts = DataTable_1.DataTable.load("accounts.xml");
crm.create("account", accounts);
var contacts = DataTable_1.DataTable.load("contacts.xml");
contacts.lookup("accountid", function (row) { return crm.retrieve("account", new Guid_1.Guid(row.accountid)); });
crm.create("contacts", contacts);
crm.fetchAll("accounts").save("accounts.xml");
crm.fetchAll("accounts").save("accounts.json");
crm.update("account", { accountid: "2ad7a34f-11db-4910-8f1c-397b1352f0e3", name: "updated" });
crm.update("account", { name: { like: "%test%" } }, { name: "updated" });
