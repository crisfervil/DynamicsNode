/// <reference path="../../typings/tsd.d.ts"/>

import {DataTable} from "../../Data/DataTable";
import assert = require("assert");


describe("Data",function(){
  describe("DataTable", function(){

    it("Initializes from an existing Array",function(){

      var rows = new Array<Object>();
      rows.push({prop1:"value1",prop2:"value2"});
      rows.push({prop1:"value1",prop2:"value2"});
      rows.push({prop1:"value1",prop2:"value2"});

      var dt = new DataTable(rows);
      assert.deepEqual(dt.rows,rows);
    });

    it("Loads and read JSON data",function(){

      var d = new DataTable();
      d.rows.push({prop1:"value1",prop2:"value2"});
      d.rows.push({prop1:"value1",prop2:"value2"});
      d.rows.push({prop1:"value1",prop2:"value2"});
      d.save("test.json");

      var d2 = DataTable.load("test.json");
      assert.deepEqual(d,d2, JSON.stringify(d2,null,4));
    });
  });
});
