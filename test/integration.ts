/// <reference path="../typings/tsd.d.ts"/>
import {CRMClient} from "../CRM/CRMClient";
import {Fetch} from "../CRM/Fetch";
import assert = require("assert");

describe('Integration Tests', function () {
  this.timeout(10000); // Aplyies to all the suite
  var crm = new CRMClient(); // Use the same instance of CRM cliente to improve performance

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
      assert.ok(myUser.preferredphonecode);
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
      assert.ok(records.length>0);
      for(var i=0;i<records.length;i++){
        assert.ok(records[i].businessunitid!=undefined,`item#:${i}->${JSON.stringify(records[i])}`);
        assert.ok(records[i].organizationid);
        assert.ok(records[i].organizationid_name);
        assert.ok(records[i].organizationid_type);
        assert.ok(records[i].name);
        assert.ok(records[i].createdon);
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
    assert.ok(records.length==1);
    assert.ok(records[0].domainname!=undefined,`${JSON.stringify(records[0])}`);
    assert.ok(records[0].systemuserid);
    assert.ok(records[0].businessunitid);
    assert.ok(records[0].fullname);
  });
});
