/// <reference path="../typings/main.d.ts"/>
import assert = require("assert");
import {CRMClient} from "../src/CRMClient";

describe('CRMClient', function () {
  it('Throws an exception with an invalid connection',function (){
    assert.throws(function(){
      var crm = new CRMClient("INCORRECT_CONNECTION_STRING",true);
    });
  });

  it('Tells who I am',function (){
    
    var expected = "00000000-0000-0000-0000-000000000000";
    var crm = new CRMClient("my connection string",true);
    
    var actual = crm.whoAmI();
    assert.equal(actual,expected);
    
  });

});
