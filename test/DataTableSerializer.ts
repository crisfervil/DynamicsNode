import {DataTable} from "../src/DataTable";

import {Guid} from "../src/Guid";
import assert = require("assert");
import fs = require("fs");

before(function() {
    // create temp dir if doesn't exist
    if (!fs.existsSync("test/tmp")) fs.mkdirSync("test/tmp");
});

describe("DataTableSerializer", function() {
    
    it("Loads and read JSON data", function() {

        var fileName = "test/tmp/test.json";

        // TODO: add different data types
        var d1 = new DataTable("myTable");
        d1.rows.push({ prop1: Guid.create().toString(), prop2: "value2&" }); // use xml not permitted values
        d1.rows.push({ prop1: true, prop2: "val\tue2\n", prop3: "" }); // use xml not permitted values
        d1.rows.push({ prop1: false,prop2:new Date(), prop3: 12, prop4: 12.5 });
        d1.save(fileName);

        var d2 = DataTable.load(fileName);
        assert.deepEqual(d2, d1, JSON.stringify(d2, null, 4));

    });

    it("Loads and reads XML data", function() {

        var fileName = "test/tmp/test.xml";

        // TODO: add different data types
        var d1 = new DataTable("myTable");
        d1.rows.push({ prop1: Guid.create().toString(), prop2: "value2&<>'\"" }); // use xml not permitted values
        d1.rows.push({ prop1: true, prop2: "val\tue2\n", prop3: "0001", "1 <&\'>\" ":"test" }); // use xml not permitted values as property names
        d1.rows.push({ prop1: false, prop2: new Date(), prop3: 12, prop4: 12.5, prop5: "12345" });
        d1.rows.push({ prop1: "whatever", prop2: { type: "myType", value: "my value" } });
        d1.save(fileName);

        var d2 = DataTable.load(fileName);
        assert.deepEqual(d2, d1, JSON.stringify(d2, null, 4));
    });

    it("Loads and reads Excel data", function() {
        var fileName = "test/assets/Book1.xlsx";
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

    it("Writes Excel data", function() {
        var fileName = "test/tmp/book1.xlsx";

        var d1 = new DataTable("myTable");
        d1.rows.push({ prop1: Guid.create().toString(), prop2: "value2&" }); // use xml not permitted values
        d1.rows.push({ prop1: true, prop2: "val\tue2\n", prop3: "0001" });
        d1.rows.push({ prop1: false, prop2: new Date(), prop3: 12, prop4: 12.5, prop5: "12345" });
        d1.rows.push({ prop1: "whatever", prop2: { type: "myType", value: "my value" } });

        d1.save(fileName);

        // I should be able to read what I've just written
        var d2=DataTable.load(fileName);
    }); 

    it("Writes an empty Excel table", function() {
        var fileName = "test/tmp/book2.xlsx";

        var d1 = new DataTable();
        d1.save(fileName);

        // I should be able to read what I've just written
        var d2=DataTable.load(fileName);
    }); 

    it("Throws an error on load when the extension is not supported", function() {
        
        var ext = "asdasd";
        var fileName = "test/tmp/book1." + ext;

        assert.throws(()=>{

            DataTable.load(fileName);
        
        },`Format '${ext}' not supported`);

    }); 

    it("Throws an error on save when the extension is not supported", function() {
        
        var ext = "asdasd";
        var fileName = "test/tmp/book1." + ext;

        var d1 = new DataTable();

        assert.throws(()=>{

            d1.save(fileName);
        
        },`Format '${ext}' not supported`);

    }); 


});