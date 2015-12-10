/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/custom.d.ts" />

import {DataTable} from "../Data/DataTable";
import {Guid} from "./Guid";
import {Fetch} from "./Fetch";

import path = require("path");
import edge = require("edge");

export class CRMClient {

  private crmBridge:any;

  constructor(private connectionString?: string, version?:string) {

    var versions = ["2011","2015"];

    if(version===undefined){
      // The default version is the last one
      version = versions[versions.length-1];
    }

    if (versions.indexOf(version)==-1) throw `Version ${version} not supported`;

    if(connectionString===undefined) connectionString="default";
    var config = this.tryGetModule(path.join(process.cwd(),"config.json"));
    if(config&&config.connectionStrings&&config.connectionStrings[connectionString]){
      this.connectionString=config.connectionStrings[connectionString];
    }

    if(!this.connectionString) throw "Connection String not specified";

    var source = path.join(__dirname,"CRMBridge.cs");
    var ref1 = path.join(__dirname,`bin/${version}/Microsoft.Crm.Sdk.Proxy.dll`);
    var ref2 = path.join(__dirname,`bin/${version}/Microsoft.Xrm.Client.dll`);
    var ref3 = path.join(__dirname,`bin/${version}/Microsoft.Xrm.Sdk.dll`);
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


  whoAmI(){
    return this.crmBridge.WhoAmI(null,true);
  }

  retrieve(entityName: string, id: string|Guid, columns?: string|string[]|boolean): any {
    var idValue:string;

    // TODO: If the id doesn't exists, return null instead of throwing an exception

    if(id instanceof Guid) {
      idValue=id.getValue();
    }
    else{
      idValue = id;
    }

    var params:any = {entityName:entityName,id:idValue,columns:true};
    if(columns!==undefined) {
      if(typeof columns == "string")
      {
        params.columns = [columns];
      }
      else
      {
        params.columns = columns;
      }
    }

    var retrieveResult = this.crmBridge.Retrieve(params,true);
    // convert the result to a js object
    var result = this.convert(retrieveResult);
    return result;
  }

  retrieveMultiple(fetchXml: string): Array<any>;
  retrieveMultiple(entityName: string, conditions?, attributes?:boolean|string|string[]): Array<any>;
  retrieveMultiple(entityName: string, conditions?, attributes?:boolean|string|string[]): Array<any> {
    var result = new Array<any>();

    var fetchXml=entityName;
    if(conditions!=undefined){
      var fetch = new Fetch(entityName);
      fetch.setFilter(conditions);
      if(attributes!=undefined){
        fetch.setAttributes(attributes);
      }
      fetchXml = fetch.toString();
    }

    var retrieveResult = this.crmBridge.RetrieveMultiple(fetchXml,true);

    for (let i = 0; i < retrieveResult.length; i++) {
        var record = retrieveResult[i];
        var convertedRecod = this.convert(record);
        result.push(convertedRecod);
    }

    return result;
  }

  retrieveAll(entityName: string): Array<any> {
    var fetch = new Fetch(entityName,"*");
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

  delete(entityName: string, idsOrConditions):number{
    var ids:string[];
    var recordsAffected = 0;

    if(idsOrConditions instanceof Guid) {
      ids=[idsOrConditions.getValue()];
    }
    else if (typeof idsOrConditions == "string") {
      ids = [idsOrConditions];
    }
    else if (Array.isArray(ids)){
      // TODO: check the value type of each item
      ids = idsOrConditions;
    }
    else if (typeof idsOrConditions == "object" && !(idsOrConditions instanceof Date)) {
      // Get the records that meet the specified criteria
      // The id field of an entity is always the entity name + "id"
      // TODO: Except for activities
      var idField:string = `${entityName}id`.toLowerCase();
      var foundRecords = this.retrieveMultiple(entityName,idsOrConditions,idField);
      ids = [];
      for(var i=0;i<foundRecords.length;i++){
        ids.push(foundRecords[i][idField]);
      }
    }

    recordsAffected = this.deleteMultiple(entityName,ids);
    return recordsAffected;
  }

  private deleteMultiple(entityName: string, ids: string[]):number{
    var idValue:string;
    var recordsAffected = 0;

    for(var i=0;i<ids.length;i++){
      var params:any = {entityName:entityName,id:ids[i]};
      this.crmBridge.Delete(params,true);
      recordsAffected++;
    }
    return recordsAffected;
  }

  update(entityName: string, attributes: any, conditions?): number {

    var updatedRecordsCount=0;
    var values = new Array<any>();

    // prepare values
    for(var prop in attributes){
      var attrName = prop.toLowerCase();
      values.push(attrName);
      values.push(attributes[prop]);
    }

    // get records GUIDS
    if(conditions!=undefined){
      // The id field of an entity is always the entity name + "id"
      // TODO: Except for activities
      var idField:string = `${entityName}id`.toLowerCase();
      var foundRecords = this.retrieveMultiple(entityName,conditions,idField);
      var idFieldIndex = values.indexOf(idField);
      if(idFieldIndex<0) {
          // Add the id field to the values array and save the attribute index
          idFieldIndex = values.push(idField) - 1;
          values.push(null);
      }
      for(var i=0;i<foundRecords.length;i++){
        var foundRecordId=foundRecords[i][idField];
        values[idFieldIndex+1]=foundRecordId;
        var params:any = {entityName:entityName,values:values};
        this.crmBridge.Update(params,true);
      }
      updatedRecordsCount=foundRecords.length;
    }
    else {
      // the attributes parameter must contain the entity id on it
      var params:any = {entityName:entityName,values:values};
      this.crmBridge.Update(params,true);
      updatedRecordsCount=1;
    }

    return updatedRecordsCount;
  }
}
