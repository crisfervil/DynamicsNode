import {DataTable} from "../src/DataTable";
import {Guid} from "../src/Guid";
import assert = require("assert");
import fs = require("fs");

before(function() {
    // create temp dir if doesn't exist
    if (!fs.existsSync("test/tmp")) fs.mkdirSync("test/tmp");
});

describe("DataTable", function() {
    
    it("Initializes from an existing Array", function() {

        var rows = new Array<Object>();
        rows.push({ prop1: "value1", prop2: "value2" });
        rows.push({ prop1: "value1", prop2: "value2" });
        rows.push({ prop1: "value1", prop2: "value2" });

        var dt = new DataTable(null, rows);
        assert.deepEqual(dt.rows, rows);
    });

    it("Loads and read JSON data", function() {

        var fileName = "test/tmp/test.json";

        // TODO: add different data types
        var d1 = new DataTable("myTable");
        d1.rows.push({ prop1: Guid.create().toString(), prop2: "value2&" }); // use xml not permitted values
        d1.rows.push({ prop1: true, prop2: "val\tue2\n", prop3: "" }); // use xml not permitted values
        d1.rows.push({ prop1: false,/*prop2:new Date(), */prop3: 12, prop4: 12.5 });
        d1.save(fileName);

        var d2 = DataTable.load(fileName);
        assert.deepEqual(d2, d1, JSON.stringify(d2, null, 4));

    });

    it("Loads and reads XML data", function() {

        var fileName = "test/tmp/test.xml";

        // TODO: add different data types
        var d1 = new DataTable("myTable");
        d1.rows.push({ prop1: Guid.create().toString(), prop2: "value2&" }); // use xml not permitted values
        d1.rows.push({ prop1: true, prop2: "val\tue2\n", prop3: "0001" });
        d1.rows.push({ prop1: false, prop2: new Date(), prop3: 12, prop4: 12.5, prop5: "12345" });
        d1.rows.push({ prop1: "whatever", prop2: { type: "myType", value: "my value" } });
        d1.save(fileName);

        var d2 = DataTable.load(fileName);
        assert.deepEqual(d2, d1, JSON.stringify(d2, null, 4));
    });

    it("Looks up for simple values", function(){

        var dt = new DataTable();
        dt.rows.push({val1:1,val2:2},
                     {val1:2,val2:2});
        dt.lookup("val1",row=>++row.val1);
        assert.equal(dt.rows[0].val1,2);
        assert.equal(dt.rows[1].val1,3);
    });

    it("Looks up for simple values using cache", function(){

        var dt = new DataTable();
        dt.rows.push({val1:2,val2:2},
                     {val1:2,val2:2});
        // returns a random value
        dt.lookup("val1",row=>Math.random(),true);
        // The values in both rows must match
        assert.equal(dt.rows[0].val1,dt.rows[1].val1);

    });

    it("Looks up for simple values whitout cache", function(){

        var dt = new DataTable();
        dt.rows.push({val1:2,val2:2},
                     {val1:2,val2:2});
        // returns a random value
        dt.lookup("val1",row=>Math.random(),false);
        // The values in both rows must match
        assert.notEqual(dt.rows[0].val1,dt.rows[1].val1);
    });

    it("Loads and reads Excel data", function() {
        var fileName = "./test/assets/book1.xlsx";
        var dt = DataTable.load(fileName);

        assert.equal(dt.name,"Sheet1");
        assert.equal(dt.rows.length,7);

        for (var i = 0; i < 7; i++) {
            var currentRow = dt.rows[i];
            var expectedRow = { Col1:`Value ${i+1} Col 1`,
                                Col2:`Value ${i+1} Col 2`,
                                Col3:`Value ${i+1} Col 3`,
                                Col4:`Value ${i+1} Col 4`};
            assert.deepEqual(currentRow,expectedRow);            
        }
    });    
});