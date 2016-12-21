import path = require("path");
import fs = require("fs");
import XMLWriter = require('xml-writer');
import et = require('elementtree');
import * as XLSX from 'xlsx';

var debug = require("debug")("dynamicsnode");

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

    /** Method to convert all the existing values in a column. 
     * Iterates through all the existing rows, and for every value in the specified column calls to the specified callback method.
     * Then, the returning value will be applied to the column.
     * The idea behind this functionality is that you can resolve the lookup data that you may have in a DataTable, before sending
     * those values to CRM.
     * For example, you may want to load a list of contacts, and you want to associate your contacts to existing parent accounts. 
     * What you can do, is use the phone number on the contact to try to find the parent account of the contact. 
     * @example <caption>Lookup using simple values</caption>
     *  var dt = new DataTable();
     *  dt.rows.push({val1:1,val2:2},
     *               {val1:2,val2:2});
     *  dt.lookup("val1",row=>++row.val1);
     *  console.log(dt.rows[0].val1); // prints out 2
     *  console.log(dt.rows[1].val1); // prints out 3
     * @example <caption>Find the parent account of a contact using the phone number</caption>
     *   // create a contact using a data table and associate to the create account using the phone number
     *   var dtContacts = DataTable.load("MyContactsToLoad.json");
     * 
     *   // resolve the parentaccountid field
     *   dtContacts.lookup("parentcustomerid",row=>{ return {id:crm.retrieve("account",{telephone1:row.telephone1}).accountid,type:"account"}});
     * 
     *   crm.create(dtContacts);
     */
    lookup(columnName: string, updater: (row: any) => any, useCache:boolean = false): void {
        var cache = {}; // Temporary cache 
        for(var i = 0; i < this.rows.length; i++) {
            var currentRow = this.rows[i];
            var lookupValue = currentRow[columnName];
            var resolvedValue=null;
            if(useCache&&lookupValue!==undefined&&lookupValue!==undefined&&cache[lookupValue]!==undefined){
                resolvedValue=cache[lookupValue];
            }
            if(resolvedValue==null){
                resolvedValue = updater(currentRow);
                if(useCache&&lookupValue!==undefined&&lookupValue!==undefined){
                    cache[lookupValue] = resolvedValue;
                } 
            }
            currentRow[columnName] = resolvedValue;
        }
    }

    /** The path is relative to process.cwd() */
    save(fileName: string) {
        var strValue: string;
        var ext = path.extname(fileName);
        if (ext != null) ext = ext.toLowerCase();
        if (ext == ".json") {
            debug("Serializing to json...");
            strValue = JSON.stringify(this, null, 4);
        }
        else if (ext == ".xml") {
            debug("Serializing to xml...");
            strValue = this.serializeXml(this);
        }
        else {
            throw new Error(`Format "${ext}" not supported`);
        }
        if (strValue != null) {
            debug(`About to write ${strValue.length} bytes to file...`);
            fs.writeFileSync(fileName, strValue);
        }
    }

    /** The path is relative to process.cwd() */
    static load(fileName: string): DataTable {
        var dt: DataTable;
        var ext = path.extname(fileName);
        if (ext != null) ext = ext.toLowerCase();

        var strContent:string;

        if (ext == ".json") {
            strContent = fs.readFileSync(fileName, "utf8")
            dt = JSON.parse(strContent, this.JSONDataReviver);
            if (dt && dt.rows === undefined) throw "The parsed file doesn't look like a DataTable";
        }
        else if (ext == ".xml") {
            strContent = fs.readFileSync(fileName, "utf8")
            dt = this.parseXml(strContent);
        }
        else if (ext == ".xlsx") {
            dt = this.parseExcel(fileName);
        }        
        else {
            throw new Error(`Format "${ext}" not supported`);
        }
        return dt;
    }

    private static parseNumbers(str): any {
        var result: any = null;
        // http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
        var isNumber = !Array.isArray(str) && (+str - parseFloat(str) + 1) >= 0;
        if (isNumber) {
            result = +str;
        }
        return result;
    };

    private static parseBooleans(str: string) {
        var result: any = null;
        if (/^(?:true|false)$/i.test(str)) {
            result = str.toLowerCase() === 'true';
        }
        return result;
    };

    private static parseDates(str): any {
        var result: any = null;
        var dateParts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.*(\d*)Z$/.exec(str);
        if (dateParts !== null) {
            result = new Date(Date.UTC(+dateParts[1], +dateParts[2] - 1, +dateParts[3], +dateParts[4], +dateParts[5], +dateParts[6], +dateParts[7]));
        }
        return result;
    }

    private static parseValue(str) {
        var result: any = str;
        if (typeof str === 'string') {
            var parsedValue = DataTable.parseBooleans(str);
            if (parsedValue === null) {
                parsedValue = DataTable.parseNumbers(str);
            }
            if (parsedValue === null) {
                parsedValue = DataTable.parseDates(str);
            }
            if (parsedValue !== null) {
                result = parsedValue;
            }
        }
        return result;
    }

    private static JSONDataReviver(key, str) {
        var result: any = str;
        if (typeof str === 'string' || str instanceof String) {
            var parsedValue = DataTable.parseDates(str);
            if (parsedValue !== null) {
                result = parsedValue;
            }
        }
        return result;
    };

    private static parseExcel(fileName: string): DataTable {

        var dt = new DataTable();
        var workBook = XLSX.readFile(fileName);
        var sheetName = workBook.SheetNames[0];
        var workSheet = workBook.Sheets[sheetName];

        dt.name=sheetName;

        var rangeName:any = workSheet["!ref"];
        var range = XLSX.utils.decode_range(rangeName);
        var from = range.s, to=range.e;

        // Assume the firs row contains column names
        for (var rowIndex = from.r+1, tableRowIndex=0; rowIndex <= to.r; rowIndex++,tableRowIndex++) {
            var row = {};
            for (var colIndex = from.c, tableColIndex=0; colIndex <= to.c; colIndex++,tableColIndex++) {

                // Get the column name
                var nameColRange =XLSX.utils.encode_cell({r:from.r,c:colIndex});
                var colName:any = workSheet[nameColRange];

                var currentRange = XLSX.utils.encode_cell({r:rowIndex,c:colIndex});
                var colValue = workSheet[currentRange];

                if(colName!==undefined&&colName.v!==null&&colName.v!==null&&
                    colValue!==undefined&&colValue.v!==undefined&&colValue.v!==null){
                    row[colName.v]=colValue.v;
                }
            }
            dt.rows.push(row);
        }

        return dt;
    }

    private static parseXml(xmlContent: string): DataTable {
        var dt = new DataTable();
        var etree = et.parse(xmlContent);
        var rootElement = etree.getroot();
        
        var attrName = rootElement.attrib["name"];
        if(attrName) dt.name = attrName;
        
        var rowElements = rootElement.getchildren();
        for(var i=0;i<rowElements.length;i++){
            var rowElement = rowElements[i];
            var rowItem = {};
            var rowFieldElements = rowElement.getchildren();
            for(var j=0;j<rowFieldElements.length;j++){
                var rowFieldElement = rowFieldElements[j];
                var fieldName = rowFieldElement.tag;
                var fieldValue = rowFieldElement.text;
                var fieldType = rowFieldElement.attrib["type"];
                var parsedValue = DataTable.parseXmlValue(fieldValue);
                if(fieldType){
                    parsedValue = {type:fieldType,value:parsedValue};
                } 
                rowItem[fieldName] = parsedValue;
            }
            dt.rows.push(rowItem);
        }
        
        return dt;
    }

    private static parseXmlValue(strValue:string){
        var result:any=strValue;
        var parsedValue = DataTable.parseBooleans(strValue);
        if (parsedValue === null) {
            parsedValue = DataTable.parseNumbers(strValue);
        }
        if (parsedValue === null) {
            parsedValue = DataTable.parseDates(strValue);
        }
        if (parsedValue !== null) {
            result = parsedValue;
        }
        return result;
    }

    private serializeXml(data: DataTable): string {
        var returnValue: string;
        if (DataTable != null) {
            var xw = new XMLWriter(true);
            xw.startElement('DataTable');
            if (this.name) xw.writeAttribute("name", this.name);
            for (var i = 0; i < data.rows.length; i++) {
                xw.startElement('row');
                var rowItem = data.rows[i];
                for (var propName in rowItem) {
                    var propValue = rowItem[propName];
                    if (propValue != null) {
                        xw.startElement(propName);
                        var strValue;
                        if (typeof propValue == "object" && !(propValue instanceof Date) && propValue.type) {
                            // this value must contain typeinfo
                            xw.writeAttribute("type",propValue.type);    
                            strValue = this.serializeValue(propValue.value);
                        }
                        else {
                            strValue = this.serializeValue(propValue);
                        }
                        xw.text(strValue);
                        xw.endElement();
                    }
                }
                xw.endElement(); // row
            }
            xw.endElement(); // DataTable
            returnValue = xw.toString();
        }
        return returnValue;
    }

    private serializeValue(value) {
        var result = value.toString();
        if (value != null && value instanceof Date) {
            result = JSON.stringify(value).replace(/\"/g, "");
        }
        return result;
    }
}
