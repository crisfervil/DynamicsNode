import assert = require("assert");
import {Guid} from "../src/Guid";

describe('Guid', function () {
  it('Creates an instance of non empty Guid',function(){
      var guid1 = Guid.create();
      var guid2 = new Guid(guid1.getValue());
      assert.notEqual(guid2,undefined);
      assert.notEqual(guid2.getValue(),Guid.empty().getValue());
      assert.equal(guid1.getValue(),guid2.getValue());
  });

  it('Creates an instance of empty Guid',function(){
      var guid = new Guid();
      assert.notEqual(guid,undefined);
      assert.equal(guid.getValue(),Guid.empty().getValue());
  });

  it('Creates an instance from a string',function(){
      var v = "4C1ECDF4-633B-E211-9EB5-0050568A69E2";
      var guid = new Guid(v);
      assert.notEqual(guid,undefined);
      assert.equal(guid.getValue(),v);
  });

  it('Validates Guid format on creation',function(){
    assert.throws(()=>{
      var v = "test";
      var guid = new Guid(v);
    },Error);
  });

  it('Generates new Guids',function(){
      assert.notEqual(Guid.create().getValue(),Guid.create().getValue());
  });

  it('Compares two different Guids',function(){
      var guid1 = Guid.create();
      var guid2 = Guid.create();
      assert.equal(guid1.equals(guid2),false);
  });

  it('Compares two equal Guids',function(){
      var guid1 = Guid.create();
      var guid2 = new Guid(guid1.getValue());
      assert.equal(guid1.equals(guid2),true);
  });

  it('Compares a Guid value with a string',function(){
      var guid1 = Guid.create();
      assert.equal(guid1.equals(guid1.getValue()),true);
  });

});
