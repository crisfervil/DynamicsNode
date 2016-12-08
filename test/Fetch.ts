import {Fetch} from "../src/Fetch";
import assert = require("assert");


describe('Fetch', function () {
    it('Serializes an Empty Fetch',function(){
        var fetch = new Fetch();
        var expected = 
`<fetch>
    <entity></entity>
</fetch>`;
        assert.equal(fetch.toString(),expected);
    });
  it('Serializes a simple Fetch',function(){
      // the entity name and column names must be lowercased
      var fetch = new Fetch("tEst",["*"]);
      var expected =
`<fetch>
    <entity name="test">
        <all-attributes/>
    </entity>
</fetch>`;
      assert.equal(fetch.toString(),expected);
  });
  it('Serializes a simple Fetch with conditions',function(){
      // the entity name and column names must be lowercased
      var fetch = new Fetch("tEst",["*"],{attr:"myValue",attr2:"myValue2"});
      var expected =
`<fetch>
    <entity name="test">
        <all-attributes/>
        <filter type="and">
            <condition attribute="attr" operator="eq" value="myValue"/>
            <condition attribute="attr2" operator="eq" value="myValue2"/>
        </filter>
    </entity>
</fetch>`;
      assert.equal(fetch.toString(),expected);
  });
  it('Serializes a complex Fetch',function(){
        // the entity name and column names must be lowercased
        var fetch = new Fetch("tEst",["*"],{attr:"myValue",aTTr2:{$neq:22},attr3:{$in:["value1","value2"]},
                            attr4:new Date(Date.UTC(1982,2,17)),ATtr5:false,attr6:["value1",false],attr7:null,
                            attr8:"$notNull"});

      var expected =
`<fetch>
    <entity name="test">
        <all-attributes/>
        <filter type="and">
            <condition attribute="attr" operator="eq" value="myValue"/>
            <condition attribute="attr2" operator="neq" value="22"/>
            <condition attribute="attr3" operator="in">
                <value>value1</value>
                <value>value2</value>
            </condition>
            <condition attribute="attr4" operator="eq" value="1982-02-17 00:00:00"/>
            <condition attribute="attr5" operator="eq" value="false"/>
            <condition attribute="attr6" operator="in">
                <value>value1</value>
                <value>false</value>
            </condition>
            <condition attribute="attr7" operator="null"/>
            <condition attribute="attr8" operator="not-null"/>
        </filter>
    </entity>
</fetch>`;
      assert.equal(fetch.toString(),expected);
  });

});
