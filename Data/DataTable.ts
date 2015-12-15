import path = require("path");
import fs = require("fs");


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
    var ext = path.extname(fileName);
    if(ext==".json"){
      fs.writeFileSync(fileName,JSON.stringify(this,null,4));
    }
  }

  /** The path is relative to process.cwd() */
  static load(fileName:string):DataTable
  {
    var dt:DataTable;
    var ext = path.extname(fileName);
    if(ext==".json") {
      var content = fs.readFileSync(fileName,"utf8");
      dt = JSON.parse(content);
      if(dt&&dt.rows===undefined) throw "The parsed file doesn't look like a DataTable";
    }
    return dt;
  }
}
