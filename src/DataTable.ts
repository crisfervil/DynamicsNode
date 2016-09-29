import path = require("path");
import fs = require("fs");
import XMLWriter = require('xml-writer');
import et = require('elementtree');

var debug = require("debug")("dynamicsnode");

export class DataTable {
    rows: Array<any> = [];

    constructor(public name?: string, rows?: Array<any>) {
        if (rows !== undefined) {
            this.rows = rows;
        }
    }

    lookup(columnName: string, updater: (row: any) => any): void {
        for (var i = 0; i < this.rows.length; i++) {
            var currentRow = this.rows[i];
            var value = updater(currentRow);
            currentRow[columnName] = value;
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

        var strContent = fs.readFileSync(fileName, "utf8");

        if (ext == ".json") {
            dt = JSON.parse(strContent, this.JSONDataReviver);
            if (dt && dt.rows === undefined) throw "The parsed file doesn't look like a DataTable";
        }
        else if (ext == ".xml") {
            dt = this.parseXml(strContent);
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
