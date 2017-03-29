import { DataTableSerializer } from './DataTableSerializer';

var debug = require('debug')('dynamicsnode');

export class DataTable {
    rows: Array<any> = [];
 
    /** Default constructor
     * @class DataTable
     * @classdesc Represents a DataTable object. Contains methods to save and load the row values from a file. 
     */
    constructor(public name?: string, rows?: Array<any>) {
        if (rows !== undefined) {
            this.rows = rows;
        }
    }

    /**
     * Callback that receives a row of a data table and returns a value for a column
     * @callback DataTable~lookupCallback
     * @param {object} row Object containing the values of a row
     * @return {object} The value to apply to a specific column of that particular row
     */


    /** Method to convert all the existing values in a column. 
     * Iterates through all the existing rows, and for every value in the specified column calls to the specified callback method.
     * Then, the returning value will be applied to the column.
     * The idea behind this functionality is that you can resolve the lookup data that you may have in a DataTable, before sending
     * those values to CRM.
     * For example, you may want to load a list of contacts, and you want to associate your contacts to existing parent accounts. 
     * What you can do, is use the phone number on the contact to try to find the parent account of the contact. 
     * @param {string} columnName Name of the column which values are going to be updated
     * @param {DataTable~lookupCallback} updater Function that will process every record in the Table.
     * @method DataTable#lookup
     * @example <caption>Lookup using simple values</caption>
     *  var dt = new DataTable();
     *  dt.rows.push({val1:1,val2:2},
     *               {val1:2,val2:2});
     *  dt.lookup('val1',row=>++row.val1);
     *  console.log(dt.rows[0].val1); // prints out 2
     *  console.log(dt.rows[1].val1); // prints out 3
     * @example <caption>Find the parent account of a contact using the phone number</caption>
     *  // create a contact using a data table and associate to the create account using the phone number
     *  var dtContacts = DataTable.load("MyContactsToLoad.json");
     * 
     *  // resolve the parentcustomerid field
     *  dtContacts.lookup("parentcustomerid",row=>{ return {id:crm.retrieve("account",{telephone1:row.telephone1}).accountid,type:"account"}});
     * 
     *  // create the record
     *  crm.create(dtContacts);
     */
    lookup(columnName: string, updater: (row: any) => any, useCache:boolean = true): void {
        var cache = {}; // Temporary cache 
        debug(`Resolving lookups for columm '${columnName}'. ${useCache?"Using Cache":""}...`);
        for(var i = 0; i < this.rows.length; i++) {
            debug(`${i} of ${this.rows.length}`);
            var currentRow = this.rows[i];
            var lookupValue = currentRow[columnName];
            var resolvedValue=null;
            if(useCache&&lookupValue!==undefined&&lookupValue!==null&&cache[lookupValue]!==undefined){
                debug(`Resolved Lookup '${columnName}' value '${lookupValue}' using cache`);
                resolvedValue=cache[lookupValue];
                debug(`resolved value: '${resolvedValue}'`);
            }
            else {
                resolvedValue = updater(currentRow);
                if(useCache&&lookupValue!==undefined&&lookupValue!==null){
                    // add the resolved value to the cache
                    cache[lookupValue] = resolvedValue;
                } 
            }
            if(resolvedValue===undefined){
                if(currentRow[columnName]!==undefined){
                    delete currentRow[columnName];
                }
            }
            else {
                currentRow[columnName] = resolvedValue;
            }
        }
    }

    /** Removes a column from the Table
     * @method DataTable#removeColumn
     * @param columnName {string} Name of the column to remove 
     * @example <caption>Remove an existing column</caption>
     *  var dt = new DataTable();
     *  dt.rows.push({val1:1,val2:2},
     *               {val1:2,val2:2});
     *  dt.removeColumn('val1');
     *  console.log(dt.rows[0].val1); // prints undefined
     *  console.log(dt.rows[1].val1); // prints undefined
     *  console.log(dt.rows[0].val2); // prints 2
     *  console.log(dt.rows[1].val2); // prints 2
    */
    removeColumn(columnName:string){
        for (var i = 0; i < this.rows.length; i++) {
            delete this.rows[i][columnName];
        }
    }

    /** Renames an existing column in the Table 
     * @method DataTable#rename
     * @param columnName {string} Name of the existing column to rename
     * @param newName {string} New Name to apply to the column
     * @example <caption>Rename an existing column</caption>
     *  var dt = new DataTable();
     *  dt.rows.push({val1:1,val2:2},
     *               {val1:2,val2:2});
     *  dt.renameColumn('val1','val3');
     *  console.log(dt.rows[0].val1); // prints undefined
     *  console.log(dt.rows[1].val1); // prints undefined
     *  console.log(dt.rows[0].val2); // prints 2
     *  console.log(dt.rows[1].val2); // prints 2
     *  console.log(dt.rows[0].val3); // prints 1
     *  console.log(dt.rows[1].val3); // prints 2
    */
    renameColumn(columnName:string, newName:string){
        for (var i = 0; i < this.rows.length; i++) {
            if(this.rows[i][columnName]!==undefined){
                this.rows[i][newName]=this.rows[i][columnName];
                delete this.rows[i][columnName];
            }
        }
    }

    /** Saves the specified datatable object to the specified file.
     * The format of the file depends on the extension provided. 
     * The supported formats are json, xml and xlsx. 
     * @method DataTable#save
     * @param {dataTable} DataTable Table to save to the specified file.
     * @param {fileName} string File path where to save the DataTable object. The path is relative to process.cwd()
     * @example <caption>Saves the datatable to a .json file</caption>
     * var dt = new DataTable();
     * dt.save('mydata.json'); 
    */
    save(fileName:string):void{
        DataTableSerializer.save(this,fileName);
    }

    /**
     * Loads the {@link DataTable} object from the specified file. 
     * @memberof DataTable
     * @static
     * @param {fileName} string File path where to save the DataTable object. The path is relative to process.cwd() 
     * @example <caption>Loads the table from an xlsx file</caption>
     * var dt = DataTable.load('mydata.xlsx');
     */
    static load(fileName:string):DataTable{
        return DataTableSerializer.load(fileName);
    }
}
