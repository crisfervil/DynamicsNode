/// <reference path="../../typings/tsd.d.ts"/>
import assert = require("assert");
import {CRMClient} from "../../CRM/CRMClient";

describe('Integration Tests', function () {
  this.timeout(10000); // Aplyies to all the suite
  var crm = new CRMClient("default"); // Use the same instance of CRM cliente to improve performance

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
  });

  it('Performs a retrieve with specific columns',function (){
      var who = crm.WhoAmI();
      assert.ok(who);
      var myUser = crm.retrieve("systemuser",who,["fullname","DomainName","internalemailaddress","systemuserid"]);
      assert.ok(myUser);
  });
});
