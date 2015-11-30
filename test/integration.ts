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

  it('Knows Who I am',function (){
      var who = crm.WhoAmI();
      assert.ok(who);
  });

  it('Performs a simple retrieve',function (){
      var who = crm.WhoAmI();
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
      var who = crm.WhoAmI();
      assert.ok(who);
      // Use different casing in entity and field names
      var myUser = crm.retrieve("systemuser",who,["fullname","DomainName","internalemailaddress","systemuserid"]);
      assert.ok(myUser);
  });

  it('Performs a retrieve with all columns',function (){
      var who = crm.WhoAmI();
      assert.ok(who);
      // Use different casing in entity and field names
      var myUser = crm.retrieve("systemuser",who,true);
      assert.ok(myUser);
  });

  it('Performs a "retrieve all" of an entity',function (){
      var records = crm.retrieveAll("sysTEMuser");// the entity name must be lowercased
      assert.ok(records);
      assert.ok(records.length>0);
      for(var i=0;i<records.length;i++){
        assert.ok(records[i].domainname!=undefined,`item#:${i}->${JSON.stringify(records[i])}`);
        assert.ok(records[i].systemuserid);
        assert.ok(records[i].businessunitid);
        assert.ok(records[i].fullname);
      }
  });

  it('Performs a simple retrieve multiple',function (){
    var who = crm.WhoAmI();
    assert.ok(who);
    var fetch = new Fetch("SystemUser",["*"],{systemuserid:who});
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
