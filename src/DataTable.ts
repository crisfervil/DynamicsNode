import path = require("path");
import fs = require("fs");
import XMLWriter = require('xml-writer');
import xml2js = require('xml2js');

export class DataTable
{
  rows:Array<any>=[];

  constructor(rows?:Array<any>){
  if(rows!==undefined){
      this.rows=rows;
    }
  }

  lookup(columnName:string, updater: (row:any)=>any):void
  {
    for (var i = 0; i < this.rows.length; i++) {
        var currentRow = this.rows[i];
        var value = updater(currentRow);
        currentRow[columnName]=value;
    }
  }

  /** The path is relative to process.cwd() */
  save(fileName:string){
    var strValue:string;
    var ext = path.extname(fileName);
    if(ext!=null) ext=ext.toLowerCase();
    if(ext==".json"){
      strValue = JSON.stringify(this,null,4);
    }
    else if (ext==".xml"){
      strValue = this.serializeXml(this);
    }
    else{
      throw new Error(`Format "${ext}" not supported`);
    }
    if(strValue!=null){
      fs.writeFileSync(fileName,strValue);
    }
  }

  /** The path is relative to process.cwd() */
  static load(fileName:string):DataTable
  {
    var dt:DataTable;
    var ext = path.extname(fileName);
    if(ext!=null) ext=ext.toLowerCase();

    var strContent = fs.readFileSync(fileName,"utf8");

    if(ext==".json") {
      dt = JSON.parse(strContent,this.JSONDataReviver);
      if(dt&&dt.rows===undefined) throw "The parsed file doesn't look like a DataTable";
    }
    else if (ext == ".xml"){
      dt = this.parseXml(strContent);
    }
    else{
      throw new Error(`Format "${ext}" not supported`);
    }
    return dt;
  }

  private static parseNumbers (str):any {
      var result:any = null;
      // http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
      var isNumber = !Array.isArray(str) && (+str - parseFloat( str ) + 1) >= 0;
      if (isNumber) {
          result = +str;
      }
      return result;
  };

  private static parseBooleans (str:string)  {
    var result:any = null;
    if (/^(?:true|false)$/i.test(str)) {
      result = str.toLowerCase() === 'true';
    }
    return result;
  };

  private static parseDates(str):any{
    var result:any = null;
    var dateParts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.*(\d*)Z$/.exec(str);
    if (dateParts!==null) {
        result= new Date(Date.UTC(+dateParts[1], +dateParts[2] - 1, +dateParts[3], +dateParts[4],+dateParts[5], +dateParts[6], +dateParts[7]));
    }
    return result;
  }

  private static parseValue(str){
    var result:any = str;
    if (typeof str === 'string' || str instanceof String) {
        var parsedValue = DataTable.parseBooleans(str);
        if(parsedValue===null){
          parsedValue = DataTable.parseNumbers(str);
        }
        if(parsedValue===null){
          parsedValue = DataTable.parseDates(str);
        }
        if(parsedValue!==null){
          result=parsedValue;
        }
    }
    return result;
  }

  private static JSONDataReviver(key, str) {
    var result:any=str;
    if (typeof str === 'string' || str instanceof String) {
      var parsedValue = DataTable.parseDates(str);
      if(parsedValue!==null){
        result = parsedValue;
      }
    }
    return result;
  };

  private static parseXml(xmlContent:string):DataTable {
    var dt: DataTable;

    if(xmlContent!==undefined&&xmlContent!=null){
      var parser = new xml2js.Parser({async:false,explicitArray:false, valueProcessors:[DataTable.parseValue]});
      parser.parseString(xmlContent,function (err, result) {
        if(result&&result.DataTable&&result.DataTable.row){
          dt = new DataTable(result.DataTable.row);
        }
      });
    }

    return dt;
  }

  private serializeXml(data:DataTable):string{
    var returnValue:string;
    if(DataTable!=null){
      var xw = new XMLWriter(true);
      xw.startElement('DataTable');
      //xw.startElement('rows');
      for(var i=0;i<data.rows.length;i++){
        xw.startElement('row');
        var rowItem = data.rows[i];
        for(var propName in rowItem){
          var propValue = rowItem[propName];
          if(propValue!=null){
            xw.startElement(propName);
            var strValue = this.serializeValue(propValue);
            xw.text(strValue);
            xw.endElement();
          }
        }
        xw.endElement(); // row
      }
      //xw.endElement(); // rows
      xw.endElement(); // DataTable
      returnValue = xw.toString();
    }
    return returnValue;
  }

  private serializeValue(value){
    var result=value.toString();
    if(value!=null&&value instanceof Date){
      result = JSON.stringify(value).replace(/\"/g,"");
    }
    return result;
  }

}
