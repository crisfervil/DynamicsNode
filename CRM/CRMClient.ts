/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/custom.d.ts" />

import {DataTable} from "../Data/DataTable";
import {Guid} from "./Guid";

import path = require("path");
import edge = require("edge");

export class CRMClient {

  private crmBridge:any;

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

  retrieve(entityName: string, id: string|Guid, columns?: string[]|boolean): any {
    var idValue:string;
    var result;

    if(id instanceof Guid) {
      idValue=id.getValue();
    }
    else{
      idValue = id;
    }

    var params:any = {entityName:entityName,id:idValue,columns:true};
    if(columns!==undefined) {
      params.columns = columns;
    }

    var retrieveResult = this.crmBridge.Retrieve(params,true);

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

  create(entityName: string, attributes: any): string {
    var values = new Array<any>();

    for(var prop in attributes){
      values.push(prop);
      values.push(attributes[prop]);
    }

    var params = {entityName:entityName,values:values};
    var createdGuid = this.crmBridge.Create(params,true);
    return createdGuid;
  }

  delete(entityName: string, id: string|Guid):void{
    var idValue:string;

    if(id instanceof Guid) {
      idValue=id.getValue();
    }
    else {
      idValue = id;
    }

    var params:any = {entityName:entityName,id:idValue};
    this.crmBridge.Delete(params,true);
  }

  fetchAll(entityName: string): DataTable {
    return new DataTable();
  }



  //update(entityName:string,values:any):void;
  update(entityName: string, criteria: any, values?: any): void {

  }

}
