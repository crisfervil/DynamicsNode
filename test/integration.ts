import {CRMClient} from "../src/CRMClient";
import {Fetch} from "../src/Fetch";
import {Guid} from "../src/Guid";
import {DataTable} from "../src/DataTable";
import assert = require("assert");
import path = require("path");
import fs = require("fs");


before(function(){
  // create temp dir if doesn't exist
  if(!fs.existsSync("test/tmp")) fs.mkdirSync("test/tmp");
});

function tryGetModule(moduleId: string) {
  var result = null;
  try {
    result = require(moduleId);
  } catch (e) { }

  return result;
}

// add tests for connection string in environment variable
if(process.env.INTEGRATION_TESTS_CONN_STRING){
    addTestsFor("ENV_VARIABLE", process.env.INTEGRATION_TESTS_CONN_STRING);
}

// add tests for connection string in config.json
var config = tryGetModule(path.join(process.cwd(),"config.json"));
if(config&&config.connectionStrings){
    for(var conn in config.connectionStrings){
        if ((<string>conn).indexOf("IntegrationTest")==0) // if the connection string name begins with IntegrationTest
        {
            addTestsFor(conn, config.connectionStrings[conn]);
        }
    }
}

function addTestsFor(connectionStringName:string, connectionStringValue:string):void {
  describe(`Integration tests: ${connectionStringName}`, function () {
    this.timeout(15000); // Aplyies to all the suite
    var crm = new CRMClient(connectionStringValue); // Use the same instance of CRM cliente to improve performance

    it('Throws an exception with an invalid connection',function (){
        assert.throws(function(){
        var crm1 = new CRMClient("asdasd");
        });
    });

    it('Creates an account',function (){
        // Use different casing in entity and field names
        var guid = crm.create("acCount",{name:"test account", description:"this is a test", AccountCategoryCode:1});
        assert.ok(guid);
        // delete created record
        crm.delete("account",guid);
    });

    it('Updates an account',function (){
        // Use different casing in entity and field names
        var account:any = {name:"test account", description:"this is a test", AccountCategoryCode:1};
        var guid = crm.create("acCount",account);
        assert.ok(guid);
        account.accountid=guid;
        account.name = "updated account";
        account.description = "updated description";
        account.AccountCategoryCode = 2;
        crm.update("account",account);

        var updatedAccount = crm.retrieve("account",guid,["name","description","accountcategorycode"]);
        assert.ok(updatedAccount);
        assert.equal(updatedAccount.name,account.name);
        assert.equal(updatedAccount.description,account.description);
        assert.equal(updatedAccount.AccountCategoryCode,account.accountcategorycode);

        // delete created record
        crm.delete("account",guid);
    });

    it('Updates an account using a criteria',function (){
        // Use different casing in entity and field names
        var specificName = "xxxtest accountxxx"
        var account:any = {name:specificName, description:"this is a test", AccountCategoryCode:1};
        var guid = crm.create("acCount",account);
        assert.ok(guid);
        var updateValues = {nAMe:"updated account",desCRiption:"updated description",AccountCategoryCode:2};
        var affectedRecords = crm.update("account",updateValues,{name:specificName});
        assert.equal(affectedRecords,1);
        var updatedAccount = crm.retrieve("account",guid,["name","description","accountcategorycode"]);
        assert.ok(updatedAccount);
        assert.equal(updatedAccount.name,updateValues.nAMe);
        assert.equal(updatedAccount.description,updateValues.desCRiption);
        assert.equal(updatedAccount.accountcategorycode,updateValues.AccountCategoryCode);

        // delete created record
        crm.delete("account",guid);
    });

    it('Knows Who I am',function (){
        var who = crm.whoAmI();
        assert.ok(who);
    });

    it('Performs a simple retrieve',function (){
        var who = crm.whoAmI();
        assert.ok(who);
        var myUser = crm.retrieve("systemuser",who);
        assert.ok(myUser);
        // test just a few properties
        assert.ok(myUser.domainname);
        assert.ok(myUser.businessunitid);
        assert.ok(myUser.fullname);
        assert.ok(myUser.modifiedon);
        assert.ok(myUser.modifiedby);
        assert.ok(myUser.modifiedby_name);
        assert.ok(myUser.modifiedby_type);
        assert.ok(myUser.invitestatuscode);
        assert.ok(myUser.emailrouteraccessapproval,JSON.stringify(myUser));
    });

    it('Performs a retrieve that doesnt returns any records',function (){

      var record = crm.retrieve("account",{name:"#^*^%^@*"});
      assert.equal(record,null);

    });

    it('Performs a retrieve that doesnt returns any records using a GUID',function (){

      var record = crm.retrieve("account", Guid.create());
      assert.equal(record,null);

    });

    it('Performs a retrieve with specific columns',function (){
        var who = crm.whoAmI();
        assert.ok(who);
        // Use different casing in entity and field names
        var myUser = crm.retrieve("systemuser",who,["fullname","DomainName","internalemailaddress","systemuserid"]);
        assert.ok(myUser);
    });

    it('Performs a retrieve with all columns',function (){
        var who = crm.whoAmI();
        assert.ok(who);
        // Use different casing in entity and field names
        var myUser = crm.retrieve("systemuser",who,true);
        assert.ok(myUser);
    });

    it('Performs a "retrieve all" of an entity',function (){
        //this.timeout(15000); // aplyies only to this test
        var records = crm.retrieveAll("buSineSSunit");// the entity name must be lowercased
        assert.ok(records);
        assert.ok(records.rows.length>0);
        for(var i=0;i<records.rows.length;i++){
          assert.ok(records.rows[i].businessunitid!=undefined,`item#:${i}->${JSON.stringify(records[i])}`);
          assert.ok(records.rows[i].organizationid);
          assert.ok(records.rows[i].organizationid_name);
          assert.ok(records.rows[i].organizationid_type);
          assert.ok(records.rows[i].name);
          assert.ok(records.rows[i].createdon);
        }
    });

    it('Performs a simple retrieve multiple',function (){
      var who = crm.whoAmI();
      assert.ok(who);
      var fetch = new Fetch("SystemUser","*",{systemuserid:who});
      var fetchXml = fetch.toString();
      // Use different casing in entity and field names
      var records = crm.retrieveMultiple(fetchXml);
      assert.ok(records);
      assert.ok(records.rows.length==1);
      assert.ok(records.rows[0].domainname!=undefined,`${JSON.stringify(records[0])}`);
      assert.ok(records.rows[0].systemuserid);
      assert.ok(records.rows[0].businessunitid);
      assert.ok(records.rows[0].fullname);
    });
    
    it('Performs a retrieve all',function (){
        // retrieve all the leads
        var leads = crm.retrieveAll("lead");
        assert.ok(leads);
        assert.ok(leads.rows.length>0);
    });    

    it('Associates and Disassociates a lead and an contact',function (){
        // retrieve any lead
        var leads = crm.retrieveMultiple("lead",null,"leadid");
        var lead = leads.rows[0];
        
        // retrieve any contact
        var contacts = crm.retrieveMultiple("contact",null,"contactid");
        var contact = contacts.rows[0];
        
        // associate them
        crm.associate("contact",contact.contactid,"contactleads_association","lead",lead.leadid);
        
        // delete association
        crm.disassociate("contact",contact.contactid,"contactleads_association","lead",lead.leadid);
    });

    it('Associates and Disassociates a lead and an contact using a DataTable',function (){
        // retrieve any lead
        var leads = crm.retrieveMultiple("lead",null,"leadid");
        var lead = leads.rows[0];
        
        // retrieve any contact
        var contacts = crm.retrieveMultiple("contact",null,"contactid");
        var contact = contacts.rows[0];
        
        // Create the datatable
        var dt = new DataTable("contactleads_association");
        var row = {from:{type:"contact",value:contact.contactid},to:{type:"lead",value:lead.leadid}};
        dt.rows.push(row);
        
        // associate them
        crm.associateData(dt);
        
        // delete association
        crm.disassociateData(dt);
    });

    it('Gets entity metadata',function (){   
        var metadata = crm.getEntityMetadata("account");
        assert.ok(metadata,JSON.stringify(metadata));
    });


    it.skip("Export and import users to a File",function(){
      var fileName = `test/tmp/users-${connectionStringName}.xml`;

      var users = crm.retrieveAll("systemuser");
      users.save(fileName);
      var users2 = DataTable.load(fileName);
      assert.deepEqual(users,users2);
    });
  });
}
