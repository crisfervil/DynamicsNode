/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/custom.d.ts" />

import {DataTable} from "../Data/DataTable";
import {CRMConnection} from "./CRMConnection";
import {Guid} from "./Guid";

import path = require("path");
import edge = require("edge");


export class CRMClient {

  crmBridge:any;

  constructor(private connectionString: string) {

    var config = this.tryGetModule("../config.json");
    if(config&&config.connectionStrings&&config.connectionStrings[connectionString]){
      this.connectionString=config.connectionStrings[connectionString];
    }

    if(!this.connectionString) throw "Connection String not specified";

    var source = path.join(__dirname,"CRMBridge.cs");
    var ref1 = path.join(__dirname,"bin/Microsoft.Crm.Sdk.Proxy.dll");
    var ref2 = path.join(__dirname,"bin/Microsoft.Xrm.Client.dll");
    var ref3 = path.join(__dirname,"bin/Microsoft.Xrm.Sdk.dll");
    var ref4 = path.join("System.Runtime.Serialization.dll");
    
    var createBridge = edge.func({
      source: source,
      references: [ ref1, ref2, ref3, ref4 ]
    });

    this.crmBridge = createBridge(this.connectionString,true); 
  }

  private tryGetModule(moduleId: string) {
    var result = null;
    try {
      result = require(moduleId);
    } catch (e) { }

    return result;
  }

  WhoAmI(){
    return this.crmBridge.WhoAmI(null,true);
  }

  retrieve(entityName: string, id: Guid, columns?: string[]|boolean): any {
    var result;
    var retrieveResult = this.crmBridge.Retrieve({entityName:entityName,id:id.getValue(),columns:columns},true);
    
    // convert the result to a js object
    if (retrieveResult){
        result={};
        for(var i=0;i<retrieveResult.length;i+=2)
        {
          result[retrieveResult[i]]=retrieveResult[i+1];
        }
    }
    
    return result;
  }

  fetchAll(entityName: string): DataTable {
    return new DataTable();
  }

  create(entityName: string, attributes: any): Guid {
    return new Guid();
  }

  //update(entityName:string,values:any):void;
  update(entityName: string, criteria: any, values?: any): void {

  }

}
