import {DataTable} from "../src/DataTable";
import {Guid} from "../src/Guid";
import assert = require("assert");

describe("DataTable", function() {
    
    it("Initializes from an existing Array", function() {

        var rows = new Array<Object>();
        rows.push({ prop1: "value1", prop2: "value2" });
        rows.push({ prop1: "value1", prop2: "value2" });
        rows.push({ prop1: "value1", prop2: "value2" });

        var dt = new DataTable(null, rows);
        assert.deepEqual(dt.rows, rows);
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

    it("Looks up with undefined values", function(){

        var dt = new DataTable();
        dt.rows.push({val1:1,val2:2},
                     {val1:2,val2:2});
        // returns a random value
        dt.lookup("val1",row=>row.val1==1?undefined:3);
        // The values in both rows must match
        assert.deepEqual(dt.rows[0].val1,undefined);
        assert.deepEqual(dt.rows[1].val1,3);
    });

    it("Renames a column", function(){

        var dt = new DataTable();
        dt.rows.push({val1:1,val2:2},
                     {val1:2,val3:3});
        
        dt.renameColumn('val1','val4');
        dt.renameColumn('val2','val5');

        // val1 and val2 should have gone
        assert.deepEqual(dt.rows[0],{val4:1,val5:2});
        assert.deepEqual(dt.rows[1],{val4:2,val3:3});
    });
    
    it("Removes a column", function(){

        var dt = new DataTable();
        dt.rows.push({val1:1,val2:2},
                     {val1:2,val3:3});
        
        dt.removeColumn('val2');

        // val2 should have gone
        assert.deepEqual(dt.rows[0],{val1:1});
        assert.deepEqual(dt.rows[1],{val1:2,val3:3});

        dt.removeColumn('val3');

        // val3 should have gone
        assert.deepEqual(dt.rows[0],{val1:1});
        assert.deepEqual(dt.rows[1],{val1:2});
    });
});