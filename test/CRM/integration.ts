/// <reference path="../../typings/tsd.d.ts"/>
import assert = require("assert");
import {CRMClient} from "../../CRM/CRMClient";

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
});
