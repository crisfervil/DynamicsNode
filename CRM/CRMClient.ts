/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/custom.d.ts" />

import {DataTable} from "../Data/DataTable";
import {Guid} from "./Guid";
import {Fetch} from "./Fetch";

import path = require("path");
import edge = require("edge");

export class CRMClient {

  private crmBridge:any;

  constructor(private connectionString?: string) {
    if(connectionString===undefined) connectionString="default";
    var config = this.tryGetModule(path.join(process.cwd(),"config.json"));
    if(config&&config.connectionStrings&&config.connectionStrings[connectionString]){
      this.connectionString=config.connectionStrings[connectionString];
    }

    if(!this.connectionString) throw "Connection String not specified";

    var source = path.join(__dirname,"CRMBridge.cs");
    var ref1 = path.join(__dirname,"bin/2011/Microsoft.Crm.Sdk.Proxy.dll");
    var ref2 = path.join(__dirname,"bin/2011/Microsoft.Xrm.Client.dll");
    var ref3 = path.join(__dirname,"bin/2011/Microsoft.Xrm.Sdk.dll");
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

  private convert(propertiesArray:Array<any>){
    var converted:any=null;
    if (propertiesArray){
        converted={};
        for(var i=0;i<propertiesArray.length;i++)
        {
          var propValue = propertiesArray[i];
          converted[propValue[0]]=propValue[1];
        }
    }
    return converted;
  }


  WhoAmI(){
    return this.crmBridge.WhoAmI(null,true);
  }

  retrieve(entityName: string, id: string|Guid, columns?: string[]|boolean): any {
    var idValue:string;

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
    var result = this.convert(retrieveResult);
    return result;
  }

  retrieveMultiple(fetchXml: string): Array<any> {
    var result = new Array<any>();

    var retrieveResult = this.crmBridge.RetrieveMultiple(fetchXml,true);

    for (let i = 0; i < retrieveResult.length; i++) {
        var record = retrieveResult[i];
        var convertedRecod = this.convert(record);
        result.push(convertedRecod);
    }

    return result;
  }

  retrieveAll(entityName: string): Array<any> {
    var fetch = new Fetch(entityName,["*"]);
    var fetchXml = fetch.toString();
    var result = this.retrieveMultiple(fetchXml);
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

  //update(entityName:string,values:any):void;
  update(entityName: string, criteria: any, values?: any): void {

  }

}
