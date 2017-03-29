import { IDataTableSerializer } from './IDataTableSerializer'
import { DataTable } from './DataTable';
import { XmlEncode } from './XmlEncode';
import XMLWriter = require('xml-writer');
import et = require('elementtree');


/** Default constructor
 * @class DataTableXmlSerializer
 * @classdesc Saves and loads a {@link DataTable} object to and from an Xml file. 
 */
export class DataTableXmlSerializer implements IDataTableSerializer {
    readonly extension: string;

    constructor() {
        this.extension = 'xml';
    }

    /** Serializes the specified {@link DataTable} object into a Buffer data.
     * @method DataTableXmlSerializer#serialize
    */
    serialize(dataTable: DataTable): Buffer {
        var returnValue: string;
        if (dataTable != null) {
            var xw = new XMLWriter(true);
            xw.startElement('DataTable');
            if (dataTable.name) xw.writeAttribute("name", dataTable.name);
            for (var i = 0; i < dataTable.rows.length; i++) {
                xw.startElement('row');
                var rowItem = dataTable.rows[i];
                for (var propName in rowItem) {
                    var propValue = rowItem[propName];
                    if (propValue != null) {
                        var strValue = null, propType = null;
                        if (typeof propValue == "object" && !(propValue instanceof Date) && propValue.type !== null && propValue.type !== undefined) {
                            // this value must contain typeinfo
                            propType = propValue.type;
                            strValue = this.serializeValue(propValue.value);
                        }
                        else {
                            strValue = this.serializeValue(propValue);
                        }
                        if (strValue !== null) {
                            xw.startElement(XmlEncode.encodeName(propName));
                            if (propType !== null && propType !== undefined) {
                                xw.writeAttribute("type", propValue.type);
                            }
                            xw.text(strValue);
                            xw.endElement();
                        }
                    }
                }
                xw.endElement(); // row
            }
            xw.endElement(); // DataTable
            returnValue = xw.toString();
        }
        return new Buffer(returnValue,'utf8');
    }

    /** Deserializes the specified buffer data into a {@link DataTable} object
     * @method DataTableXmlSerializer#deserialize
    */
    deserialize(xmlContent: Buffer): DataTable {
        var dt = new DataTable();
        var etree = et.parse(xmlContent.toString('utf8'));
        var rootElement = etree.getroot();

        var attrName = rootElement.attrib["name"];
        if (attrName) dt.name = attrName;

        var rowElements = rootElement.getchildren();
        for (var i = 0; i < rowElements.length; i++) {
            var rowElement = rowElements[i];
            var rowItem = {};
            var rowFieldElements = rowElement.getchildren();
            for (var j = 0; j < rowFieldElements.length; j++) {
                var rowFieldElement = rowFieldElements[j];
                var fieldName = XmlEncode.decodeName(rowFieldElement.tag);
                var fieldValue = rowFieldElement.text;
                var fieldType = rowFieldElement.attrib["type"];
                var parsedValue = this.parseXmlValue(fieldValue);
                if (fieldType) {
                    parsedValue = { type: fieldType, value: parsedValue };
                }
                rowItem[fieldName] = parsedValue;
            }
            dt.rows.push(rowItem);
        }

        return dt;
    }

    private serializeValue(value) {
        var result = null;
        if (value !== null && value !== undefined) {
            if (value instanceof Date) {
                result = JSON.stringify(value).replace(/\"/g, "");
            }
            else {
                result = value.toString();
            }
        }
        return result;
    }

    private parseXmlValue(strValue:string){
        var result:any=strValue;
        var parsedValue = this.parseBooleans(strValue);
        if (parsedValue === null) {
            parsedValue = this.parseNumbers(strValue);
        }
        if (parsedValue === null) {
            parsedValue = this.parseDates(strValue);
        }
        if (parsedValue !== null) {
            result = parsedValue;
        }
        return result;
    }

    private parseNumbers(str): any {
        var result: any = null;
        // http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
        var isNumber = !Array.isArray(str) && (+str - parseFloat(str) + 1) >= 0;
        if (isNumber) {
            result = +str;
        }
        return result;
    };

    private parseBooleans(str: string) {
        var result: any = null;
        if (/^(?:true|false)$/i.test(str)) {
            result = str.toLowerCase() === 'true';
        }
        return result;
    };

    private parseDates(str): any {
        var result: any = null;
        var dateParts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.*(\d*)Z$/.exec(str);
        if (dateParts !== null) {
            result = new Date(Date.UTC(+dateParts[1], +dateParts[2] - 1, +dateParts[3], +dateParts[4], +dateParts[5], +dateParts[6], +dateParts[7]));
        }
        return result;
    }        
}