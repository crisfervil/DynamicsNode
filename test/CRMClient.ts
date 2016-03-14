/// <reference path="../typings/main.d.ts"/>
import assert = require("assert");
import {CRMClient} from "../src/CRMClient";

describe('CRMClient', function () {
  it('Throws an exception with an invalid connection',function (){
    assert.throws(function(){
      var crm = new CRMClient("");
      //crm.whoAmI();
    });
  });

  it('Tells who I am',function (){
    
    var expected = "test";
    
    var testBridge = {
        WhoAmI: (params,callback)=>expected
    }
    
    var crm = new CRMClient("test",testBridge);
    
    var actual = crm.whoAmI();
    assert.equal(actual,expected);
    
  });

});
