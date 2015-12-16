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
      dt = JSON.parse(strContent);
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


  private static parseNumbers (str:string):any {

    var result:any = str;
    var parsedValue = parseFloat(str);

    if (!isNaN(parsedValue)) {
      result = parsedValue % 1 === 0 ? parseInt(str, 10) : parsedValue;
    }
    return result;
  };

  private static parseBooleans (str:string):any  {
    var result:any = str;
    if (/^(?:true|false)$/i.test(str)) {
      result = str.toLowerCase() === 'true';
    }
    return result;
  };

  private static parseXml(xmlContent:string):DataTable {
    var dt: DataTable;

    if(xmlContent!==undefined&&xmlContent!=null){
      var parser = new xml2js.Parser({async:false,explicitArray:false, valueProcessors:[this.parseBooleans,this.parseNumbers]});
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
            xw.text(propValue.toString());
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
}
