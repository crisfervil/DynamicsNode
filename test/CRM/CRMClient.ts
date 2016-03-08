/// <reference path="../../typings/main.d.ts"/>
import assert = require("assert");
import {CRMClient} from "../../CRM/CRMClient";

describe('CRMClient', function () {
  it('Throws an exception with an invalid connection',function (){
    assert.throws(function(){
      var crm = new CRMClient("asdasdasd");
      //crm.whoAmI();
    });
  });

});
