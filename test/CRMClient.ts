import assert = require("assert");
import {CRMClient} from "../src/CRMClient";
import {Guid} from "../src/Guid";
import {WhoAmIRequest,WhoAmIResponse} from "../src/Messages";

describe('CRMClient', function () {
  it('Throws an exception with an invalid connection - using fake',function (){
    assert.throws(function(){
      var crm = new CRMClient("INCORRECT_CONNECTION_STRING",true);
    });
  });

  it('Tells who I am',function (){
    
    var expected = "73174763-ed0e-4aeb-b02a-9f6dc078260a";
    var crm = new CRMClient("my connection string",true);
    
    var actual = crm.whoAmI();
    assert.equal(actual.UserId,expected);
    
  });
  
  it('Creates a record',function (){
    
    var expected = "00000000-0000-0000-0000-000000000000";
    var crm = new CRMClient("my connection string",true);
    
    var record = {prop1:123};
    var actual = crm.create("myEntity",record);
    assert.equal(actual,expected);
  });

  it('Deletes a record',function (){
    
    var expected = 1;
    var crm = new CRMClient("my connection string",true);
    
    var actual = crm.delete("myEntity","73174763-ed0e-4aeb-b02a-9f6dc078260a");
    assert.equal(actual,expected);
  });
  
  it('Updates a record',function (){
    
    var expected = 1;
    var crm = new CRMClient("my connection string",true);
    
    var record = {prop1:123};
    var actual = crm.update("myEntity",record);
    assert.equal(actual,expected);
  });  

  it('Associates two records',function (){   
    var crm = new CRMClient("my connection string",true);
    crm.associate("myEntity",Guid.create(),"my_relationship", "myEntity",Guid.create());
  });
  
  it('Disassociates two records',function (){   
    var crm = new CRMClient("my connection string",true);
    crm.disassociate("myEntity",Guid.create(),"my_relationship", "myEntity",Guid.create());
  });

  it('Gets entity metadata',function (){   
    var crm = new CRMClient("my connection string",true);
    var metadata = crm.getEntityMetadata("myEntity");
    assert.equal(metadata.SchemaName,"myEntity");
  });

  it('Executes a WhoAmIRequest',function (){   
    var crm = new CRMClient("my connection string",true);
    var myRequest = new WhoAmIRequest();
    var response:WhoAmIResponse = crm.Execute(myRequest);
    assert.equal(response.UserId,"73174763-ed0e-4aeb-b02a-9f6dc078260a");
  });
  it('Executes an assigment',function (){   
    var crm = new CRMClient("my connection string",true);
    crm.assign(Guid.create(),"asdfasdf",Guid.create());
  });

});
