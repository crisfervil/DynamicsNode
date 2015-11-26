/// <reference path="../../typings/tsd.d.ts"/>
import assert = require("assert");
import {CRMClient} from "../../CRM/CRMClient";

describe('CRMClient', function () {
  it('Throws an exception with an invalid connection',function (){
    assert.throws(function(){
      new CRMClient("asdasdasd");
    });
  });

});
