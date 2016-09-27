
import {DataTable} from "./DataTable";
import {Guid} from "./Guid";
import {Fetch} from "./Fetch";
import {Dictionary} from "./Dictionary";

import path = require("path");
import edge = require("edge");
var debug = require("debug")("dynamicsnode");

/**
 * @class Allows to access to CRM functions.
 * @param {string} connectionString Optional. A valid connection string or connection string name
 */
export class CRMClient {

    private _crmBridge: any;
    private _metadataCache=new Dictionary();

    constructor(public connectionString: string = "default", fakeBridge: boolean = false) {

        var config = this.tryGetModule(path.join(process.cwd(), "config.json"));
        if (config && config.connectionStrings && config.connectionStrings[connectionString]) {
            this.connectionString = config.connectionStrings[connectionString];
        }

        this._crmBridge = this.getBridge(fakeBridge);
    }


    private getBridge(fakeBridge: boolean) {

        var source = path.join(__dirname, "CRMBridge.cs");
        var ref1 = path.join(__dirname, "bin/Microsoft.Crm.Sdk.Proxy.dll");
        var ref2 = path.join(__dirname, "bin/Microsoft.Xrm.Client.dll");
        var ref3 = path.join(__dirname, "bin/Microsoft.Xrm.Sdk.dll");
        var ref4 = path.join("System.Runtime.Serialization.dll");
        var ref5 = path.join(__dirname, "bin/Newtonsoft.Json.dll");

        var createBridge = edge.func({
            source: source,
            references: [ref1, ref2, ref3, ref4, ref5]
        });

        var bridge = createBridge({ connectionString: this.connectionString, useFake: fakeBridge }, true);
        return bridge;
    }

    private tryGetModule(moduleId: string) {
        var result = null;
        try {
            result = require(moduleId);
        } catch (e) { }

        return result;
    }

    private convert(propertiesArray: Array<any>) {
        var converted: any = null;
        if (propertiesArray) {
            converted = {};
            for (var i = 0; i < propertiesArray.length; i++) {
                var propValue = propertiesArray[i];
                if(propValue[1] instanceof Array){
                    var convertedValues=[];
                    for (var j = 0; i < propValue[1].length; i++) {
                        var arrayItem = propValue[1][j];
                        convertedValues.push(this.convert(arrayItem));
                    }
                    converted[propValue[0]] = convertedValues;
                }
                else{
                    converted[propValue[0]] = propValue[1];
                }
            }
        }
        return converted;
    }

    whoAmI() {
        return this._crmBridge.WhoAmI(null, true);
    }

    retrieve(entityName: string, idOrConditions: string | Guid | Object, pColumns?: string | string[] | boolean) {
        var idValue: string;
        var result: any;
        var columns: any;

        if (!entityName) throw "Entity name not specified";
        if (!idOrConditions) throw "Id or Conditions not specified";

        entityName = entityName.toLocaleLowerCase(); // normalize casing
    
        // validate columns
        if (pColumns === undefined) {
            columns = true; // default value
        }
        else {
            columns = pColumns;
            if (typeof pColumns == "string") {
                columns = [pColumns];
            }

            if (Array.isArray(columns)) {
                for (var i = 0; i < columns.length; i++) {
                    columns[i] = columns[i].toLocaleLowerCase(); // normalize casing;
                }
            }
        }

        if (idOrConditions instanceof Guid) {
            idValue = idOrConditions.getValue();
        }
        else if (typeof idOrConditions === "string" || idOrConditions instanceof String) {
            idValue = <string>idOrConditions;
            if (!Guid.isGuid(idValue)) throw "Invalid GUID value";
        }
        else if (typeof idOrConditions === "object") {
            // Assume a conditions objet was passed
            // Get the records that meet the specified criteria
            var idField = this.getIdField(entityName);
            var foundRecords = this.retrieveMultiple(entityName, idOrConditions, idField);
            if (foundRecords.rows !== null) {
                if (foundRecords.rows.length > 1) throw new Error("Too many records found matching the specified criteria");
                if (foundRecords.rows.length > 0) {
                    idValue = foundRecords.rows[0][idField];
                }
            }
        }
        else {
            throw new Error("invalid idOrConditions type value");
        }

        if (idValue) {
            var params: any = { entityName: entityName, id: idValue, columns: columns };
            var retrieveResult;
            try {
                retrieveResult = this._crmBridge.Retrieve(params, true);
            }
            catch (ex) {
                var rethrow = false;
                if (ex.Detail && ex.Detail.InnerFault && ex.Detail.InnerFault.Message) {
                    // Record with specified Id doesn't exists
                    var msg = `${entityName} With Id = ${idValue.toLowerCase().replace("{", "").replace("}", "")} Does Not Exist`;
                    if (ex.Detail.InnerFault.Message != msg) rethrow = true;
                }
                if (rethrow) throw ex;
            }
            // convert the result to a js object
            if (retrieveResult != null) {
                result = this.convert(retrieveResult);
            }
        }
        return result;
    }

    retrieveMultiple(fetchXml: string): DataTable;
    retrieveMultiple(entityName: string, conditions?, attributes?: boolean | string | string[]): DataTable;
    retrieveMultiple(entityNameOrFetchXml: string, conditions?, attributes?: boolean | string | string[]): DataTable {
        var result = new Array<any>();

        var fetchXml;
        if (!(conditions || attributes)) {
            // No conditions or attributes were specified, means a FetchXml value is expected.
            // Improve this: could use a regular expression to distinguish between an xml and an entity name?
            fetchXml = entityNameOrFetchXml;
        }
        else {
            var fetch = new Fetch(entityNameOrFetchXml);
            if (conditions) {
                fetch.setFilter(conditions);
            }
            if (attributes) {
                fetch.setAttributes(attributes);
            }
            fetchXml = fetch.toString();
        }

        var retrieveResult = this._crmBridge.RetrieveMultiple(fetchXml, true);

        for (let i = 0; i < retrieveResult.length; i++) {
            var record = retrieveResult[i];
            var convertedRecod = this.convert(record);
            result.push(convertedRecod);
        }

        var dt = new DataTable(entityNameOrFetchXml, result);
        return dt;
    }

    retrieveAll(entityName: string): DataTable {
        var fetch = new Fetch(entityName, "*");
        var fetchXml = fetch.toString();
        var result = this.retrieveMultiple(fetchXml);
        return result;
    }

    create(entityName: string, attributes: any): string {
      
        // perform some validations
        if (!entityName) throw "Entity name not specified";
        if (!attributes) throw "Attributes not specified";

        entityName = entityName.toLocaleLowerCase(); // normalize casing
    
        var values = new Array<any>();

        for (var prop in attributes) {
            values.push(prop.toLocaleLowerCase()); // normalize casing
            values.push(attributes[prop]);
        }

        var params = { entityName: entityName, values: values };
        var createdGuid = this._crmBridge.Create(params, true);
        return createdGuid;
    }

    delete(entityName: string, idsOrConditions): number {
        var ids: string[];
        var recordsAffected = 0;

        if (!entityName) throw "Entity name not specified";
        entityName = entityName.toLowerCase(); // normalize casing

        if (idsOrConditions instanceof Guid) {
            ids = [idsOrConditions.getValue()];
        }
        else if (typeof idsOrConditions == "string") {
            if (!Guid.isGuid(idsOrConditions)) throw "Invalid GUID value";
            ids = [idsOrConditions];
        }
        else if (Array.isArray(ids)) {
            for (var i = 0; i < ids.length; i++) {
                var item: any = ids[i];
                if (!(item instanceof Guid) || Guid.isGuid(item)) {
                    throw "Invalid GUID";
                }
            }
            ids = idsOrConditions;
        }
        else if (typeof idsOrConditions == "object" && !(idsOrConditions instanceof Date)) {
            // Get the records that meet the specified criteria
            var idField: string = this.getIdField(entityName);
            var foundRecords = this.retrieveMultiple(entityName, idsOrConditions, idField);
            ids = [];
            for (var i = 0; i < foundRecords.rows.length; i++) {
                ids.push(foundRecords.rows[i][idField]);
            }
        }

        recordsAffected = this.deleteMultiple(entityName, ids);
        return recordsAffected;
    }

    private deleteMultiple(entityName: string, ids: string[]): number {
        var recordsAffected = 0;

        for (var i = 0; i < ids.length; i++) {
            var params: any = { entityName: entityName, id: ids[i] };
            this._crmBridge.Delete(params, true);
            recordsAffected++;
        }
        return recordsAffected;
    }

    update(entityName: string, attributes: any, conditions?): number {

        var updatedRecordsCount = 0;
        var values = new Array<any>();

        if (!entityName) throw "Entity name not specified";
        entityName = entityName.toLowerCase(); // normalize casing

        // prepare values
        for (var prop in attributes) {
            var attrName = prop.toLowerCase(); // normalize casing
            values.push(attrName);
            values.push(attributes[prop]);
        }

        // get records GUIDS
        if (conditions != undefined) {
            // The id field of an entity is always the entity name + "id"
            // TODO: Except for activities
            var idField: string = `${entityName}id`.toLowerCase();
            var foundRecords = this.retrieveMultiple(entityName, conditions, idField);
            var idFieldIndex = values.indexOf(idField);
            if (idFieldIndex < 0) {
                // Add the id field to the values array and save the attribute index
                idFieldIndex = values.push(idField) - 1;
                values.push(null);
            }
            for (var i = 0; i < foundRecords.rows.length; i++) {
                var foundRecordId = foundRecords.rows[i][idField];
                values[idFieldIndex + 1] = foundRecordId;
                var params: any = { entityName: entityName, values: values };
                this._crmBridge.Update(params, true);
            }
            updatedRecordsCount = foundRecords.rows.length;
        }
        else {
            // the attributes parameter must contain the entity id on it
            var params: any = { entityName: entityName, values: values };
            this._crmBridge.Update(params, true);
            updatedRecordsCount = 1;
        }


        return updatedRecordsCount;
    }

    getIdField(entityName: string): string {

        var idAttr=null;
        var metadata = this.getEntityMetadata(entityName);

        if(metadata){
            // Find the primary Attribute
            for(var i=0;i<metadata.Attributes.length;i++){
                if(metadata.Attributes[i].IsPrimaryId==true){
                    idAttr=metadata.Attributes[i].SchemaName;
                    break;
                }
            }
        }

        if(idAttr==null) throw `Primary Attribute not found for entity ${entityName}`;

        // convert it to lowercase
        return idAttr.toLowerCase();
    }

    createOrUpdate(entityName: string, attributes, matchFields: string[]): void {
        var idField = this.getIdField(entityName);
        var conditions = {};
        for (var i = 0; i < matchFields.length; i++) {
            var matchField = matchFields[i];
            if (attributes[matchField] !== undefined && attributes[matchField] !== null) {
                conditions[matchField] = attributes[matchField];
            }
        }

        // check if the record exists
        var foundRecord = this.retrieve(entityName, conditions, idField);
        if (foundRecord) {
            // The record exists. Update it
            attributes[idField] = foundRecord[idField];
            this.update(entityName, attributes);
        }
        else {
            // The record doesn't exists. Create it
            this.create(entityName, attributes);
        }
    }

    associateData(data:DataTable){  
        for (var i = 0; i < data.rows.length; i++) {
            var row = data.rows[i];
            this.associate(row.from.type,row.from.value,data.name,row.to.type,row.to.value);
        }
    }
    
    associate(fromEntityName: string, fromEntityId: string | Guid, relationshipName: string, toEntityName: string, toEntityId: string | Guid) {
        
        // perform some validations
        if (!fromEntityName) throw "From entity name not specified";
        fromEntityName = fromEntityName.toLowerCase(); // normalize casing
        
        if (!toEntityName) throw "To entity name not specified";
        toEntityName = toEntityName.toLowerCase(); // normalize casing
        
        if (!fromEntityId) throw "fromEntityId not specified";
        if (!toEntityId) throw "toEntityId not specified";

        var fromId: string, toId: string;
        if (fromEntityId instanceof Guid) {
            fromId = fromEntityId.getValue();
        }
        else {
            fromId = <string>fromEntityId;
        }
        if (toEntityId instanceof Guid) {
            toId = toEntityId.getValue();
        }
        else {
            toId = <string>toEntityId;
        }

        var params = { entityName: fromEntityName, entityId: fromId, relationship: relationshipName, relatedEntities: [{ entityName: toEntityName, entityId: toId }] };
        this._crmBridge.Associate(params, true);
    }

    disassociateData(data:DataTable){  
        for (var i = 0; i < data.rows.length; i++) {
            var row = data.rows[i];
            this.disassociate(row.from.type,row.from.value,data.name,row.to.type,row.to.value);
        }
    }

    disassociate(fromEntityName: string, fromEntityId: string | Guid, relationshipName: string, toEntityName: string, toEntityId: string | Guid) {
        
        // perform some validations
        if (!fromEntityName) throw "From entity name not specified";
        fromEntityName = fromEntityName.toLowerCase(); // normalize casing
        
        if (!toEntityName) throw "To entity name not specified";
        toEntityName = toEntityName.toLowerCase(); // normalize casing
        
        if (!fromEntityId) throw "fromEntityId not specified";
        if (!toEntityId) throw "toEntityId not specified";


        var fromId: string, toId: string;
        if (fromEntityId instanceof Guid) {
            fromId = fromEntityId.getValue();
        }
        else {
            fromId = <string>fromEntityId;
        }
        if (toEntityId instanceof Guid) {
            toId = toEntityId.getValue();
        }
        else {
            toId = <string>toEntityId;
        }

        var params = { entityName: fromEntityName, entityId: fromId, relationship: relationshipName, relatedEntities: [{ entityName: toEntityName, entityId: toId }] };
        this._crmBridge.Disassociate(params, true);
    }
    
    getEntityMetadata(entityName:string){
        var ndx = this._metadataCache.indexOf(entityName);
        var metadata = null;
        if(ndx>-1){
            metadata = this._metadataCache.getValue(ndx);
        }
        else {
            metadata= this.getEntityMetadataFromCrm(entityName);
            this._metadataCache.push(entityName,metadata);
        }
        return metadata;
    }
    
    private getEntityMetadataFromCrm(entityName:string){
        var params = { entityName: entityName };
        var metadataStr = this._crmBridge.GetEntityMetadata(params, true);
        var metadata = JSON.parse(metadataStr);
        return metadata;
    }

    public Execute(request){
        var response = this._crmBridge.Execute(request, true);
        return response;
    }

    export (entityName:string, fileName:string){
        
        debug(`Exporting ${entityName} to ${fileName}...`);
        
        // perform some validations
        if (!entityName) throw "Entity name not specified";
        entityName = entityName.toLowerCase(); // normalize casing
                
        debug("Getting metadata...");
        var metadata = this.getEntityMetadata(entityName);
        debug("Getting data...");
        var data = this.retrieveMultiple(entityName,{});
        var rowsCount = data?data.rows?data.rows.length:0:0;
        debug(`Retrieved ${rowsCount} records`);
        debug("Saving...");
        data.save(fileName);
        debug("done!");
    }

    import (fileName:string){
        
        debug(`Importing ${fileName}...`);
        
        debug("Loading data table...");
        var dt = DataTable.load(fileName);
        debug(`${dt.rows.length} records found`);

        debug(`Getting metadata for entity ${dt.name}...`);
        var metadata = this.getEntityMetadata(dt.name);

        var idField = this.getIdField(dt.name);

        debug("Importing...");

        for(let i=0;i<dt.rows.length;i++){
            debug(`record ${i+1} of ${dt.rows.length}...`);
            this.createOrUpdate(dt.name,dt.rows[i],[idField]);
        }

        debug("done!");
    }

}
