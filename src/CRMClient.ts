
import {DataTable} from "./DataTable";
import {Guid} from "./Guid";
import {Fetch} from "./Fetch";
import {Dictionary} from "./Dictionary";
import {AssignRequest,WhoAmIRequest,WhoAmIResponse} from "./Messages";
import {Entity,EntityReference,AttributeTypeCode} from "./CRMDataTypes";

import path = require("path");
import edge = require("edge");
var debug = require("debug")("dynamicsnode");
var debugQueries = require("debug")("dynamicsnode:queries");

export class CRMClient {

    private _crmBridge: any;
    private _metadataCache=new Dictionary();

    /**
     * Default constructor
     * @classdesc Allow access to CRM functions. Contains the functions to interact with CRM services.
     * @class CRMClient
     * @param {string} connectionString Optional. A valid connection string or connection string name.
     * The connection string can be either a valid connection string or a name of an existing connection string in the file "config.json" at the root path of your application.
     * If no value is passed to the constructor, the "default" text will be assumed, which means that a connection string named "default" will be used.
     * @see {@link https://msdn.microsoft.com/en-us/library/gg695810.aspx} for further information
     * 
     * @example <caption>config.json file format</caption>
     * {
	 *      "connectionStrings":
	 *      {
     *          "default":"Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode",
     *          "connection2":"Url=http://crm.contoso.com/xrmContoso"
	 *      }
     * }
     * @example <caption>Create a connection using a valid Connection String</caption>
     * var crm = new CRMClient("Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode");
     * @example <caption>Create a connection using the connection string named "connection2" specified in the config.json file</caption>
     * var crm = new CRMClient("connection2");
     * @example <caption>Create a connection using the connection string named "default" specified in the config.json file</caption>
     * var crm = new CRMClient();
     * @example <caption>Create a connection using the connection string named "default" specified in the config.json file</caption>
     * var crm = new CRMClient("default");
     */
    constructor(public connectionString: string = "default", fakeBridge: boolean = false) {

        var config = this.tryGetModule(path.join(process.cwd(), "config.json"));
        if (config && config.connectionStrings && config.connectionStrings[connectionString]) {
            this.connectionString = config.connectionStrings[connectionString];
        }

        this._crmBridge = this.getBridge(fakeBridge);
        this.testConnection();
    }

    /**
     * Gets the bridge object between node and .net
     * @private
     * @method CRMClient#getBridge
     * @param fakeBridge {boolean} indicates if a fake bridge whants to be retrieved
     * @returns a .net bridge that allows node to interact with .net
     */
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

    /** 
    * Returns information about the current user. Useful for testing the active connection.
    * @returns a {@link WhoAmIResponse} object with the information about the authenticated user in CRM.
    * @method CRMClient#whoAmI
    * @example <caption>Returns information about the current user</caption>
    * var who = crm.whoAmI();
    * console.log(who.BusinessUnitId); // prints 6fefeb79-5447-e511-a5db-0050568a69e2
    * console.log(who.OrganizationId); // prints 2b476bd1-aaed-43ee-b386-eee0f1b87207
    * console.log(who.UserId); // prints 9ba35c25-b892-4f8a-b124-3920d9873af4
    */
    whoAmI():WhoAmIResponse {
        var request = new WhoAmIRequest();
        var response:WhoAmIResponse = this.Execute(request);        
        return response;
    }

    /**
     * Tests the active connection. Throws an exception if there's any error.
     * The method performs a {@link WhoAmIRequest}.
     * @method CRMClient#testConnection
     * @see CRMClient#whoAmI
     */
    testConnection(){
        try{
            this.whoAmI();// Performs a who am i request
        }
        catch(e){
            var error = new Error();
            throw new Error("Error trying to connect to server\n"+JSON.stringify(e));
        }
    }

    /**
     * Retrieves one single record from CRM.
     * @method CRMClient#retrieve
     * @param entityName {string} Name of the entity to be retrieved. The name is case insensitive, so all values are lowercased before being sent to CRM.
     * @param idOrConditions {string|Guid|object} Either a string with the GUID if the record to be retrieved, a {@link Guid} object with the same value, or a conditions object that returns only one record. 
     * Learn how to write condition objects: {@link Fetch#setFilter}
     * @param attributes {string|string[]|boolean} Optional. Either an attribute name, an array of attributes, or a true value indicating that all attributes must be retrieved. The default value is true. An ***** value has the same effect
     * 
     * @returns A javascript object containing the values of the record. If no data found, then a null object is returned.
     * 
     * @example <caption>Return all the columns for the specified account id</caption>
     * var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2");
     * console.log(account);
     * @example <caption>Return all the columns for the specified account id</caption>
     * var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2","*");
     * console.log(account);
     * @example <caption>Return all the columns for the specified account id</caption>
     * var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2",true);
     * console.log(account);
     * @example <caption>You can use the Guid class to specify the id parameter. This allows to perform a GUID format validation before calling the method.</caption>
     * var Guid = require("dynamicsnode").Guid;
     * var account = crm.retrieve("account",new Guid("6fefeb79-5447-e511-a5db-0050568a69e2"));
     * console.log(account);
     * @example <caption>Get the accountid,name,ownerid,createdon columns for the given account id</caption>
     * var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2",["accountid","name","ownerid","createdon"]);
     * console.log(account);
     * @example <caption>Get the name of the specified account</caption>
     * var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2","name");
     * console.log(account.name);
     * @example <caption>Accessing information about a related record</caption>
     * var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2","ownerid");
     * console.log(account.ownerid); // outputs the GUID value
     * console.log(account.ownerid_type); // outputs systemuser
     * console.log(account.ownerid_name); // outputs John Doe
     * @example <caption>Returns an account using a condition object. If there are more than one account named "Acme" then an exception will be thrown</caption>
     * var account = crm.retrieve("account",{name:"Acme"});
     * console.log(account.name);
     */
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
                    // TODO: Refactor to avoid querying CRM twice
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

    /**
     * Retrieves one or more records of the specified entity that fulfill the specified conditions.
     * @method CRMClient#retrieveMultiple
     * 
     * @param entityNameOrFetchXml {string} Name of the entity or Fetch Xml query to specify the records to be retrieved. More info: {@link https://msdn.microsoft.com/en-us/library/gg328332.aspx}
     * @param conditions {object} Optional. In case you don't want to write a FetchXml to specify the records to retrieve, you can use a conditions object to specify the criteria to retrieve records. If you omit this parameter, all the existing records of the specified entity will be retrieved; omitting this parameter is equivalent to write a FetchXml without any filter conditions. 
     * Learn how to write condition objects: {@link Fetch#setFilter}
     * @param attributes {string|string[]|boolean} Optional. Either an attribute name, an array of attributes, or a true value indicating that all attributes must be retrieved. The default value is true. An ***** value has the same effect
     * @returns {DataTable} {@link DataTable} object with the records found.
     * 
     * @see Build queries with FetchXML: {@link https://msdn.microsoft.com/en-us/library/gg328332.aspx}
     * 
     * @example <caption>Retrieves all the records of the account entity. Only the accountid column will be retrieved (the id column is always returned in all Crm queries)</caption>
     * var accounts = crm.retrieveMultiple("<fetch><entity name='account'></entity></fetch>");
     * @example <caption>Retrieves all the records of the account entity. Includes also all the columns of the entity.</caption>
     * var accounts = crm.retrieveMultiple("account");
     * @example <caption>Retrieves all the records of the account entity where the account name is equals to "contoso". Returns all the columns of the entity.</caption>
     * var accounts = crm.retrieveMultiple("account",{name:"contoso"});
     * @example <caption>Retrieves all the records of the account entity where the account name is equals to "contoso", but only the specified columns are included in the query.</caption>
     * var accounts = crm.retrieveMultiple("account",{name:"contoso"},["accountid","name","ownerid","createdon"]);
     * @example <caption>Retrieves all the records of the account entity where the account name is equals to "contoso" or "acme". Returns all the columns of the entity.</caption>
     * var accounts = crm.retrieveMultiple("account",{name:["contoso","acme"]});
     * */
    retrieveMultiple(entityNameOrFetchXml: string, conditions?, attributes?: boolean | string | string[]): DataTable {
        var result = new Array<any>();

        var fetchXml;
        if (!(conditions || attributes)) {
            // No conditions or attributes were specified, means a FetchXml value is expected.
            // TODO: Improve this. could use a regular expression to distinguish between an xml and an entity name?
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
            debugQueries(fetchXml);
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

    /** It is a simpified way of retrieving all the existing records of an entity. Is equivalent to call the {@link CRMClient#retrieveMultiple} method not specifying the conditions or attributes method
     * @method CRMClient#retrieveAll
     * @param entityName {string} Name of the entity which records you want to retrieve.
     * @returns {DataTable} {@link DataTable} object with the records found.
     * @example <caption>Retrieve all existing account records</caption>
     * var accounts = crm.retrieveAll("account"); 
    */
    retrieveAll(entityName: string): DataTable {
        var fetch = new Fetch(entityName, "*");
        var fetchXml = fetch.toString();
        var result = this.retrieveMultiple(fetchXml);
        return result;
    }


    /**
     * Creates a record in CRM. The names in the entity or attributes are case insensitive, so all the names will be lowercased before send the operation to Crm.
     * @method CRMClient#create
     * @param entityName {string} The name of the entity which record you want to create
     * @param attributes {object} Javascript object with the values the new record will have.
     * 
     * @returns {string} GUID of the record created.
     * 
     * @example <caption>Create an account named "Contoso"</caption>
     * var accountid = crm.create("account",{name:"contoso",description:"this is a test",AccountCategoryCode:1});
     * console.log(accountid);
     */
    create(entityName: string, attributes: any): string {
        var entity = this.ConvertToEntity(entityName,attributes);
        var createdGuid = this._crmBridge.Create(entity, true);
        return createdGuid;
    }

    private ConvertToEntity(entityName:string, attributes:any):Entity{
        // perform some validations
        if (!entityName) throw "Entity name not specified";
        if (!attributes) throw "Attributes not specified";

        entityName = entityName.toLocaleLowerCase(); // normalize casing

        var entity = new Entity();
        entity.LogicalName = entityName;
        entity.Attributes = {};

        for (var prop in attributes) {

            var attributeName = prop.toLocaleLowerCase(); // normalize casing 
            var attributeValue = null;

            // get the attribute from metadata
            var attributeMetadata = this.getAttributeMetadata(entityName,attributeName);

            if(attributeMetadata.AttributeType==AttributeTypeCode.String||
                attributeMetadata.AttributeType==AttributeTypeCode.Memo) {
                if(!(typeof attributes[prop] == "string")) throw `Cannot convert from "${typeof attributes[prop]}" to "string"`;
                attributeValue = attributes[prop];
            }
            else if(attributeMetadata.AttributeType==AttributeTypeCode.DateTime){
                if(!(attributes[prop] instanceof Date)) throw `Cannot convert from "${typeof attributes[prop]}" to "string"`;;
                attributeValue = attributes[prop];
            }
            else if(attributeMetadata.AttributeType==AttributeTypeCode.Lookup){
                attributeValue = this.ConvertToEntityReference(attributes[prop],attributeMetadata);
            }

            // TODO: add the rest of value types

            entity.Attributes[attributeName]=attributeValue;
        }
        // TODO: Set the Entity Id
        return entity;
    }

    private ConvertToEntityReference(attributeValue,attributeMetadata):EntityReference{
        var er=null;
        var target=null, id=null;
        if(typeof attributeValue == "string"){
            // TODO: If the value is not a GUID, find the value in the target entity
            if(attributeMetadata.Targets.Length>1) throw "Too many targets";
            target=attributeMetadata.Targets[0];
            id=attributeValue;
        }
        else if (typeof attributeValue=="object"){
            id=attributeValue.id;
            target=attributeValue.type;
        }
        if(!(target&&id)) throw "Couldn't get value";
        er=new EntityReference(id,target);
        return er;
    }

    private getAttributeMetadata(entityName:string,attributeName:string):any{
        var attributeMetadata = null;
        var entityMetadata = this.getEntityMetadata(entityName);
        if(entityMetadata&&entityMetadata.Attributes&&entityMetadata.Attributes.length>0){
            for(var i=0;i<entityMetadata.Attributes.length;i++){
                if(entityMetadata.Attributes[i].LogicalName==attributeName){
                    attributeMetadata=entityMetadata.Attributes[i];
                    break;
                }
            }
        }
        return attributeMetadata;
    }

    /**
     * Deletes one on more records in CRM, and returns the number of records affected.
     * @method CRMClient#delete
     * @param entityName {string} Name of the entity which record you want to delete
     * @param idsOrConditions {string|Guid|string[]|object} Can be either a Guid, a string, an array or a conditions object. 
     * If it is Guid will delete the record with the specified id. 
     * If it is a string, must be a Guid value, and again, will delete the records matching the specified id. 
     * If the parameter is an array, each element in it must be either a string or a Guid, and in each case, the records deleted will be the ones specified by these Guids. 
     * If it is a condition object, first, all the matching records will be retrieved, and then deleted.
     * Learn how to write condition objects: {@link Fetch#setFilter}
     * @returns {number} Number of records deleted
     * @example <caption>Delete an account with a known Guid</caption>
     * var affectedRecords = crm.delete("account","6fefeb79-5447-e511-a5db-0050568a69e2");
     * @example <caption>Delete an account with a known Guid. A validation of the Guid format will be performed before calling to the method.</caption>
     * var affectedRecords = crm.delete("account",new Guid("6fefeb79-5447-e511-a5db-0050568a69e2"));
     * @example <caption>Delete several account records at once</caption>
     * var affectedRecords = crm.delete("account",["6fefeb79-5447-e511-a5db-0050568a69e2","6fefeb79-5447-e511-a5db-0050568a69e2");
     * @example <caption>Delete all existing accounts named "contoso"</caption>
     * var affectedRecords = crm.delete("account",{name:"contoso"});
     */
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

    /**
     * Updates one or more records that meet the specified conditions and returns the number of updated records.
     * @method CRMClient#update
     * @param entityName {string} The name of the entity which record you want to update.
     * @param attributes {object} Javascript object with the values the new record will have.
     * @param conditions {opbject} Optional. Javascript condition object with the filter values that is going to be used to know which records are going to be updated. 
     * If you omit this parameter, then you have to provide the record GUID in the attributes parameter. 
     * Learn how to write condition objects: {@link Fetch#setFilter}
     * @returns {number} Number of modified records
     * 
     * @example <caption>Updates all the accounts which name is contoso, and set the attribute value to "contoso-updated"</caption>
     * var affectedRecords = crm.update("account",{name:"contoso-updated"},{name:"contoso"})
     * @example <caption>In this example, only the account with the specified account id will be updated. If the specified record id exists, then affectedRecords will be equals to 1.</caption>
     * var affectedRecords = crm.update("account",{accountid:"6fefeb79-5447-e511-a5db-0050568a69e2",name:"contoso-updated"})
     */
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
            idAttr = metadata.PrimaryIdAttribute;
        }

        if(idAttr==null) throw `Primary Attribute not found for entity ${entityName}`;

        debug(`idAttr for entity '${entityName}': '${idAttr}'`);

        // convert it to lowercase
        return idAttr.toLowerCase();
    }

    /** Takes a list of attributes and values, tries to find an existing record with those values in CRM, if it exists, then performs an update, otherwhise it creates it. 
     * @method CRMClient#createOrUpdate
     * @param entityName {string} Name of the entity which record you want to update.
     * @param attributes {object} Javascript object with the attributes you want to create or update.
     * @param matchFields {string[]} List of fields in the attributes parameter you want to use to know if the record exists in CRM.
     * The attributes specified in this parameter will be used to perform a {@link CRMClient#retrieve}. 
     * @example <caption>Create an account named "contoso". In this case, a retrieve of an account with name="contoso" will be performed. If exists, then the name and description will be updated. If it doesn't exist, then the account will be created with the specified name and description. If theres more than one account with that name, an exception will be thrown</caption>
     * crm.createOrUpdate("account",{name:"contoso", description:"Account Updated"},["name"]);
     * @example <caption>Searches for an account named "contoso" owned by me. If exists, it updates it, otherwhise it creates a new one.</caption>
     * var me = crm.whoAmI().UserId;
     * crm.createOrUpdate("account",{name:"contoso", description:"Account Updated", ownerid:me},["name","ownerid"]);
    */
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

    public assign(targetId:Guid|string, targetType:string, assigneeId:Guid|string, assigneeType?:string):void{
        // set the default value
        if(assigneeType===undefined) assigneeType="systemuser";
        var request = new AssignRequest();
        request.Assignee = new EntityReference(assigneeId.toString(),assigneeType);
        request.Target = new EntityReference(targetId.toString(),targetType);
        var response = this.Execute(request);
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
