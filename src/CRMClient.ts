
import { DataTable } from "./DataTable";
import { Guid } from "./Guid";
import { Fetch } from "./Fetch";
import { AssignRequest, WhoAmIRequest, WhoAmIResponse, RetrieveEntityRequest, RetrieveEntityResponse } from "./Messages";
import { Entity, EntityReference, OptionSetValue, AttributeTypeCode, EntityFilters, EntityMetadata, AttributeMetadata, BooleanOptionsetMetadata, OptionsetMetadata, Money, Decimal } from "./CRMDataTypes";
import { ImportExportUtil } from "./ImportExportUtil";
import { StateUtil } from "./StateUtil";
import { MetadataUtil } from "./MetadataUtil";


import path = require("path");
import edge = require("edge");
var debug = require("debug")("dynamicsnode");
var debugQueries = require("debug")("dynamicsnode:queries");

export class CRMClient {

    private _crmBridge: any;

    /**
     * Default constructor
     * @classdesc Allow access to CRM functions. Contains the functions to interact with CRM services.
     * @class CRMClient
     * @param {string} connectionString Optional. A valid connection string or connection string name.
     * The connection string can be either a valid connection string or a name of an existing connection string in the file "config.json" at the root path of your application.
     * If no value is passed to the constructor, the "default" text will be assumed, which means that a connection string named "default" will be used.
     * @see {@link https://msdn.microsoft.com/en-ie/library/mt608573.aspx} for further information
     * 
     * @example <caption>config.json file format</caption>
     * {
	 *      "connectionStrings":
	 *      {
     *          "default":"AuthType=Office365; Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode",
     *          "connection2":"AuthType=AD; Url=http://crm.contoso.com/xrmContoso"
	 *      }
     * }
     * @example <caption>Create a connection using a valid Connection String</caption>
     * var crm = new CRMClient("AuthType=Office365; Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode");
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

        var assemblyFile = path.join(__dirname, "bin/DynamicsNode.dll");

        var createBridge = edge.func({
            assemblyFile: assemblyFile
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
                if (propValue[1] instanceof Array) {
                    var convertedValues = [];
                    for (var j = 0; i < propValue[1].length; i++) {
                        var arrayItem = propValue[1][j];
                        convertedValues.push(this.convert(arrayItem));
                    }
                    converted[propValue[0]] = convertedValues;
                }
                else {
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
    whoAmI(): WhoAmIResponse {
        var request = new WhoAmIRequest();
        var response: WhoAmIResponse = this.Execute(request);
        return response;
    }

    /**
     * Tests the active connection. Throws an exception if there's any error.
     * The method performs a {@link WhoAmIRequest}.
     * @method CRMClient#testConnection
     * @see CRMClient#whoAmI
     */
    testConnection() {
        try {
            this.whoAmI();// Performs a who am i request
        }
        catch (e) {
            var error = new Error();
            throw new Error("Error trying to connect to server\n" + JSON.stringify(e));
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

        if (!entityName) throw new Error("Entity name not specified");
        if (!idOrConditions) throw new Error("Id or Conditions not specified");

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
            if (!Guid.isGuid(idValue)) throw new Error("Invalid GUID value");
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
     * Creates a record in CRM. The names in the entity or attributes are case insensitive, so all the names will be lowercased before 
     * send the operation to Crm.
     * @method CRMClient#create
     * @param entityName {string} The name of the entity which record you want to create
     * @param attributes {object} Javascript object with the values the new record will have.
     * 
     * @returns {string} GUID of the record created.
     */
    create(entity: string, attributes: Object): string;

    /**
     * Creates a record in CRM. The names in the entity or attributes are case insensitive, so all the names will be lowercased before 
     * send the operation to Crm.
     * @method CRMClient#create
     * @param entityName {string} The name of the entity which record you want to create
     * @param attributes {object} Javascript object with the values the new record will have.
     * 
     * @returns {string} GUID of the record created.
     */
    create(data: DataTable): void;
    /**
     *  Creates a record in CRM. The names in the entity or attributes are case insensitive, so all the names will be lowercased before 
     * send the operation to Crm.
     * @method CRMClient#create
     * @param entityName {string} The name of the entity which record you want to create
     * @param attributes {object} Javascript object with the values the new record will have.
     * 
     * @returns {string} GUID of the record created.
     * 
     * @example <caption>Create an account named "Contoso"</caption>
     * var accountid = crm.create("account",{name:"contoso",description:"this is a test",AccountCategoryCode:1});
     * console.log(accountid);
     * @example <caption>Create an email with activity parties</caption>
     * var contact1Id = "{6633f95b-c146-45d4-ae99-6bd84f9bf7bc}"
     * var contact2Id = "{6633f95b-c146-45d4-ae99-6bd84f9bf7bc}"
     * var userId = "{6633f95b-c146-45d4-ae99-6bd84f9bf7bc}"
     * var email = {
     *               To : [{id:contact1Id,type:"contact"},{id:contact2Id,type:"contact"}],
     *               From : [{id:userId,type:"systemuser"}],
     *               Subject : "Test Email",
     *               Description : "Test Email",
     *               DirectionCode : true
     *              };
     * var emailId = crm.create("email",email);
     */

    /**
     * Creates records in CRM using the rows defined in the DataTable. 
     * The id attribute of every created record will be updated with the generated CRM GUID.
     * You need to set the name of the table with the entity name that you want to create.
     * @method CRMClient#create
     * @param data {DataTable} DataTable with the data to be created in CRM.
     * 
     * @example <caption>Create a set of accounts using an excel file</caption>
     * var accountsToLoad = DataTable.load("AccountsToLoad.xlsx");
     * crm.create(accountsToLoad);
     * console.log(accountsToLoad.rows[0].accountid); // This will output the GUID of the created record
     */
    create(entityNameOrTable: string | DataTable, attributes?: Object): any {
        var retVal = null;

        if (entityNameOrTable instanceof DataTable) {
            if (entityNameOrTable.name == null) throw new Error("Table name not specified");
            debug(`Preparing to create ${entityNameOrTable.rows.length} records from a DataTable. Entity ${entityNameOrTable.name}...`);
            var primaryAttribute = this.getIdField(entityNameOrTable.name);
            debug(`Primary Attribute:${primaryAttribute}`);
            for (var i = 0; i < entityNameOrTable.rows.length; i++) {
                debug(`${i} of ${entityNameOrTable.rows.length}...`);
                var row = entityNameOrTable.rows[i];
                var recordId = this.createInternal(entityNameOrTable.name, row);
                // update the record id in the table
                row[primaryAttribute] = recordId;
            }
        }
        else {
            if (attributes === undefined) throw new Error("The attributes parameter is required");
            debug(`Preparing to create a ${entityNameOrTable} record...`);
            retVal = this.createInternal(entityNameOrTable, attributes);
        }
        return retVal;
    }

    private createInternal(entityName: string, attributes: any): string {
        var entity = this.ConvertToEntity(entityName, attributes);
        var createdGuid = this._crmBridge.Create(entity, true);
        return createdGuid;
    }

    private ConvertToEntity(entityName: string, attributes: any): Entity {
        // perform some validations
        if (!entityName) throw new Error("Entity name not specified");
        if (!attributes) throw new Error("Attributes not specified");

        entityName = entityName.toLocaleLowerCase(); // normalize casing
        var entityMetadata = this.getEntityMetadata(entityName);

        debug("Converting attributes to CRM Entity type...");
        var entity = new Entity();
        entity.LogicalName = entityName;
        entity.Attributes = {};

        for (var prop in attributes) {

            var attributeValue = null;

            // get the attribute from metadata
            var attributeMetadata = MetadataUtil.getAttributeMetadata(this,entityName, prop.toLocaleLowerCase());
            if (attributeMetadata) {

                if(attributes[prop]!==null){
                    if (attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.String] ||
                        attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.Memo]) {
                        attributeValue = this.ConvertToString(prop,attributes[prop]);
                    }
                    else if (attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.DateTime]) {
                        attributeValue = this.ConvertToDate(attributes[prop],attributeMetadata);
                    }
                    else if (attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.Lookup] ||
                        attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.Customer] || 
                        attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.Owner]) {
                        attributeValue = this.ConvertToEntityReference(attributes[prop], attributeMetadata);
                    }
                    else if (attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.Picklist]) {
                        attributeValue = this.ConvertToOptionset(attributes[prop], attributeMetadata);
                    }
                    else if (attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.Boolean]) {
                        attributeValue = this.ConvertToBoolean(attributes[prop], attributeMetadata);
                    }
                    else if (attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.PartyList]) {
                        attributeValue = this.ConvertToPartyList(attributes[prop], attributeMetadata);
                    }
                    else if (attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.Money]) {
                        attributeValue = this.ConvertToMoney(prop, attributes[prop]);
                    }
                    else if (attributeMetadata.AttributeType == AttributeTypeCode[AttributeTypeCode.Decimal]) {
                        attributeValue = this.ConvertToDecimal(prop, attributes[prop]);
                    }
                    else {
                        debug(`Attribute '${prop}' type '${attributeMetadata.AttributeType}' not converted. Using the raw value`);
                        attributeValue = attributes[prop];
                    }
                }

                // TODO: add the rest of value types
                entity.Attributes[attributeMetadata.LogicalName] = attributeValue;
            }
            else {
                console.log(`*** Attribute '${prop}' not found in metadata. Skipping...`);
            }
        }
        // TODO: Set the Entity Id
        debug(`Converted value:`);
        debug(entity);
        return entity;
    }

    private ConvertToDecimal(attributeName, attributeValue):Decimal{
        var decimalValue:Decimal=null;
        if(attributeValue!==null&&attributeValue!==undefined){
            if(typeof attributeValue==="number"){
                decimalValue=new Decimal(attributeValue);
            }
            else {
                throw new Error(`Cannot convert attribute '${attributeName}' value '${attributeValue}' from '${typeof attributeValue}' to 'Decimal'`);                
            }
        }
        return decimalValue;
    }

    private ConvertToMoney(attributeName, attributeValue):Money{
        var moneyValue:Money=null;
        if(attributeValue!==null&&attributeValue!==undefined){
            if(typeof attributeValue==="number"){
                moneyValue=new Money(new Decimal(attributeValue));
            }
            else {
                throw new Error(`Cannot convert attribute '${attributeName}' value '${attributeValue}' from '${typeof attributeValue}' to 'Money'`);                
            }
        }
        return moneyValue;
    }

    private ConvertToString(attributeName, attributeValue):string{
        var strValue:string=null;
        if(attributeValue!==null&&attributeValue!==undefined){
            if(typeof attributeValue==="string"){
                strValue=attributeValue;
            }
            else if (attributeValue.toString!==undefined&&typeof attributeValue.toString==="function") {
                strValue=attributeValue.toString();
            }
            else {
                throw new Error(`Cannot convert attribute '${attributeName}' value '${attributeValue}' from '${typeof attributeValue}' to 'String'`);                
            }
        }
        return strValue;
    }

    private ConvertToPartyList(attributeValue, attributeMetadata:AttributeMetadata):Array<Object> {
        var partyList=[];

        if (attributeValue instanceof Array) {
            for (var i = 0; i < attributeValue.length; i++) {
                var partyItem = attributeValue[i];
                var partyItemRecord = {partyid:partyItem};
                var convertedPartyItem = this.ConvertToEntity("activityparty",partyItemRecord);
                partyList.push(convertedPartyItem);
            }
        } 
        else {
            throw new Error(`Cannot convert attribute '${attributeMetadata.LogicalName}' value '${attributeValue}' from '${typeof attributeValue}' to 'ActivityParty'`);
        }
        
        return partyList;    
    }

    private ConvertToDate(attributeValue, attributeMetadata:AttributeMetadata): Date {
        var date:Date=null;

        if (attributeValue instanceof Date) {
            date=attributeValue;
        }
        else if (typeof attributeValue=="string"){
            date = new Date(attributeValue);
        }

        if (date===null) throw new Error(`Cannot convert attribute '${attributeMetadata.LogicalName}' value '${attributeValue}' from '${typeof attributeValue}' to 'Date'`);

        return date;    
    }

    private ConvertToBoolean(attributeValue, attributeMetadata:AttributeMetadata): boolean {
        var boolVal = null;

        if (typeof attributeValue == "boolean") {
            boolVal=attributeValue;
        }
        else if (typeof attributeValue == "number") {

            if(attributeValue==0){
                boolVal=false;
            }
            else{
                boolVal=true;
            }
        }
        else if (typeof attributeValue == "string") {
            // Try to find the string as an Optionset Label
            var optionSet = <BooleanOptionsetMetadata>attributeMetadata.OptionSet;

            if(optionSet.TrueOption.Label.UserLocalizedLabel.Label.toLowerCase()==attributeValue.toLowerCase() || 
                attributeValue.toLowerCase()=="yes"){
                boolVal=true;
            }
            else if(optionSet.FalseOption.Label.UserLocalizedLabel.Label.toLowerCase()==attributeValue.toLowerCase() ||
                attributeValue.toLowerCase()=="no"){
                boolVal=false;
            }
        }
        if(boolVal==null) {
            throw new Error(`Can't convert attribute '${attributeMetadata.LogicalName}' value '${attributeValue}' from '${typeof attributeValue}' to Boolean`);
        }

        return boolVal;
    }

    private ConvertToOptionset(attributeValue, attributeMetadata:AttributeMetadata): OptionSetValue {
        var optionSet = null;

        if (typeof attributeValue == "number") {
            optionSet = new OptionSetValue(attributeValue);
        }
        if (typeof attributeValue == "string") {
            // Try to find the string as an Optionset Label
            var optionSetMetadata = <OptionsetMetadata>attributeMetadata.OptionSet;
            for (var i = 0; i < optionSetMetadata.Options.length; i++) {
                var option = optionSetMetadata.Options[i];
                if(option.Label.UserLocalizedLabel.Label.toLowerCase()==attributeValue.toLowerCase()){
                    optionSet = new OptionSetValue(option.Value);
                    break;
                }
            }
        }
        if(optionSet==null) {
            throw new Error(`Can't convert attribute '${attributeMetadata.LogicalName}' value '${attributeValue}' from '${typeof attributeValue}' to OptionsetValue`);
        }

        return optionSet;
    }

    private ConvertToEntityReference(attributeValue, attributeMetadata: AttributeMetadata): EntityReference {
        var er = null;
        var target = null, id = null;
        if (typeof attributeValue == "string") {
            // TODO: If the value is not a GUID, find the value in the target entity
            if (attributeMetadata.Targets.length > 1) throw new Error(`Couldn't get a valid target for attribute '${attributeMetadata.LogicalName}'. Please specify a valid target using {id:string,type:string}`);
            target = attributeMetadata.Targets[0];
            id = attributeValue;
        }
        else if (typeof attributeValue == "object") {
            id = attributeValue.id;
            target = attributeValue.type;
        }
        if (!(target && id)) throw new Error(`Couldn't get a valid EntityReference value for attribute '${attributeMetadata.LogicalName}'. Please specify a valid target using {id:string,type:string}`);
        er = new EntityReference(id, target);
        return er;
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

        if (!entityName) throw new Error("Entity name not specified");
        entityName = entityName.toLowerCase(); // normalize casing

        if (idsOrConditions instanceof Guid) {
            ids = [idsOrConditions.getValue()];
        }
        else if (typeof idsOrConditions == "string") {
            if (!Guid.isGuid(idsOrConditions)) throw new Error("Invalid GUID value");
            ids = [idsOrConditions];
        }
        else if (Array.isArray(ids)) {
            for (var i = 0; i < ids.length; i++) {
                var item: any = ids[i];
                if (!(item instanceof Guid) || Guid.isGuid(item)) {
                    throw new Error("Invalid GUID");
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

        if (!entityName) throw new Error("Entity name not specified");
        entityName = entityName.toLowerCase(); // normalize casing

        debug("Preparing to update a record...");

        // get records GUIDS
        if (conditions != undefined) {
            var idField = this.getIdField(entityName);
            debug("Conditions specified. Trying to find which records that meets conditions to update...");
            var foundRecords = this.retrieveMultiple(entityName, conditions, idField);
            debug(`${foundRecords.rows.length} records found`);
            for (var i = 0; i < foundRecords.rows.length; i++) {
                debug(`updating ${i} of ${foundRecords.rows.length}`);
                var foundRecordId = foundRecords.rows[i][idField];
                attributes[idField] = foundRecordId;
                var entity = this.ConvertToEntity(entityName, attributes);
                this._crmBridge.Update(entity, true);
            }
            updatedRecordsCount = foundRecords.rows.length;
        }
        else {
            // the attributes parameter must contain the entity id on it
            var entity = this.ConvertToEntity(entityName, attributes);
            this._crmBridge.Update(entity, true);
            updatedRecordsCount = 1;
        }

        return updatedRecordsCount;
    }

    getIdField(entityName: string): string {

        var idAttr = null;
        var metadata = this.getEntityMetadata(entityName);

        if (metadata) {
            // Find the primary Attribute
            idAttr = metadata.PrimaryIdAttribute;
        }

        if (idAttr == null) throw new Error(`Primary Attribute not found for entity ${entityName}`);

        debug(`idAttr for entity '${entityName}': '${idAttr}'`);

        // convert it to lowercase
        return idAttr.toLowerCase();
    }

    /** Takes a list of attributes and values, tries to find an existing record with those values in CRM, if it exists, 
     * then performs an update, otherwhise it creates it. 
     * @method CRMClient#createOrUpdate
     * @param entityName {string} Name of the entity which record you want to update.
     * @param attributes {object} Javascript object with the attributes you want to create or update.
     * @param matchFields {string[]} List of fields in the attributes parameter you want to use to know if the record exists in CRM.
     * The attributes specified in this parameter will be used to perform a {@link CRMClient#retrieve}. 
     * @example <caption>Create an account named "contoso". In this case, a retrieve of an account with name="contoso" will be performed. 
     * If exists, then the name and description will be updated. If it doesn't exist, then the account will be created with the specified 
     * name and description. If theres more than one account with that name, an exception will be thrown</caption>
     * crm.createOrUpdate("account",{name:"contoso", description:"Account Updated"},["name"]);
     * @example <caption>Searches for an account named "contoso" owned by me. If exists, it updates it, otherwhise it creates a new one.</caption>
     * var me = crm.whoAmI().UserId;
     * crm.createOrUpdate("account",{name:"contoso", description:"Account Updated", ownerid:me},["name","ownerid"]);
    */
    createOrUpdate(entityName: string, attributes, matchFields: string[]): void {
        this.createUpdate(entityName,attributes,matchFields);
    }

    /** For every record in the specified Table, tries to find out if it does exists, and if doesn't it creates it. 
     * @method CRMClient#createIfDoesNotExist
     * @param data {DataTable} DataTable with the entity name and the records to create in CRM.
     * @param matchFields {string[]} List of fields in the attributes parameter you want to use to know if the record exists in CRM.
     * The attributes specified in this parameter will be used to perform a {@link CRMClient#retrieve}. 
     * @example <caption>Loads a list of accounts from an Excel file and creates only the ones that don't exist already in CRM.
     * It uses the email address to know if the account exists or not.</caption>
     * var accountsToLoad = DataTable.load("AccountsToLoad.xlsx");
     * crm.createIfDoesNotExist(accountsToLoad,["emailaddress1"]);
    */
    createIfDoesNotExist(data:DataTable, matchFields: string[]):void;

    /** Takes a list of attributes and values, tries to find an existing record with those values in CRM, and if doesn't exists it creates it. 
     * @method CRMClient#createIfDoesNotExist
     * @param entityName {string} Name of the entity which record you want to create.
     * @param attributes {object} Javascript object with the attributes you want to create.
     * @param matchFields {string[]} List of fields in the attributes parameter you want to use to know if the record exists in CRM.
     * The attributes specified in this parameter will be used to perform a {@link CRMClient#retrieve}. 
     * @example <caption>Create an account named "contoso" only if it doesn't exist one already with the specified email. 
     * If theres more than one account with that email, an exception will be thrown</caption>
     * crm.createIfDoesNotExist("account",{name:"contoso", description:"New Account Created", emailaddress1:"info@contoso.com"},["emailaddress1"]);
     * @example <caption>Searches for an account named "contoso" owned by me. If it doesn't exist, it creates it.</caption>
     * var me = crm.whoAmI().UserId;
     * crm.createIfDoesNotExist("account",{name:"contoso", description:"Account Updated", ownerid:me},["name","ownerid"]);
    */
    createIfDoesNotExist(entityName: string, attributes:Object, matchFields: string[]):void;

    /** For every record in the specified Table, tries to find out if it does exists, and if doesn't it creates it. 
     * @method CRMClient#createIfDoesNotExist
     * @param data {DataTable} DataTable with the entity name and the records to create in CRM.
     * @param matchFields {string[]} List of fields in the attributes parameter you want to use to know if the record exists in CRM.
     * The attributes specified in this parameter will be used to perform a {@link CRMClient#retrieve}. 
     * @example <caption>Loads a list of accounts from an Excel file and creates only the ones that don't exist already in CRM.
     * It uses the email address to know if the account exists or not.</caption>
     * var accountsToLoad = DataTable.load("AccountsToLoad.xlsx");
     * crm.createIfDoesNotExist(accountsToLoad,["emailaddress1"]);
    */
    /** Takes a list of attributes and values, tries to find an existing record with those values in CRM, and if doesn't exists it creates it. 
     * @method CRMClient#createIfDoesNotExist
     * @param entityName {string} Name of the entity which record you want to create.
     * @param attributes {object} Javascript object with the attributes you want to create.
     * @param matchFields {string[]} List of fields in the attributes parameter you want to use to know if the record exists in CRM.
     * The attributes specified in this parameter will be used to perform a {@link CRMClient#retrieve}. 
     * @example <caption>Create an account named "contoso" only if it doesn't exist one already with the specified email. 
     * If theres more than one account with that email, an exception will be thrown</caption>
     * crm.createIfDoesNotExist("account",{name:"contoso", description:"New Account Created", emailaddress1:"info@contoso.com"},["emailaddress1"]);
     * @example <caption>Searches for an account named "contoso" owned by me. If it doesn't exist, it creates it.</caption>
     * var me = crm.whoAmI().UserId;
     * crm.createIfDoesNotExist("account",{name:"contoso", description:"Account Updated", ownerid:me},["name","ownerid"]);
    */    
    createIfDoesNotExist(entityNameOrDataTable:DataTable|string, attributesOrMatchfields:string[]|Object, matchFields?: string[]): void {

        if(entityNameOrDataTable instanceof DataTable){
            var data:DataTable = entityNameOrDataTable;
            if(data===undefined||data===null) throw new Error("DataTable not specified");
            if(data.name===undefined||data.name===null) throw new Error("DataTable name not specified");
            if(!Array.isArray(attributesOrMatchfields)) throw new Error("Wrong data type for the matchFields parameter");
            var matchFields:string[]=attributesOrMatchfields;

            debug(`About to create if does not exits ${data.rows.length} records from a DataTable...`);
            for (var i = 0; i < data.rows.length; i++) {
                debug(`${i} of ${data.rows.length}...`);
                this.createUpdate(data.name,data.rows[i],matchFields,false);    
            }
        }
        else {
            if(matchFields===undefined||matchFields===null) throw new Error("matchFields not specified");
            this.createUpdate(entityNameOrDataTable,attributesOrMatchfields,matchFields,false);    
        }
    }

    private createUpdate(entityName: string, attributes:Object, matchFields: string[], update:boolean=true){
        var idField = this.getIdField(entityName);
        var conditions = {};

        debug("About to create or update a record...");
        for (var i = 0; i < matchFields.length; i++) {
            var matchField = matchFields[i];
            debug("Preparing query to know if the record exists...");
            var attr = MetadataUtil.getAttributeMetadata(this,entityName,matchField);
            if(attr===null) throw new Error(`Attribute '${matchField}' not found in entity ${entityName}`);

            if (attributes[matchField] !== undefined && attributes[matchField] !== null) {
                conditions[attr.LogicalName] = attributes[matchField];
            }
        }

        // check if the record exists
        var foundRecords = this.retrieveMultiple(entityName, conditions, idField);
        if (foundRecords&&foundRecords.rows.length>0) {
            debug(`${foundRecords.rows.length} '${entityName}' records found`);
            if(update){
                if(foundRecords.rows.length>1) throw new Error("Too many records found");
                var foundRecord = foundRecords.rows[0];
                attributes[idField] = foundRecord[idField];
                this.update(entityName, attributes);
            }
        }
        else {
            debug("The record doesn't exists. Create it");
            this.create(entityName, attributes);
        }
    }

    /** */
    associateData(data: DataTable) {
        for (var i = 0; i < data.rows.length; i++) {
            var row = data.rows[i];
            this.associate(row.from.type, row.from.value, data.name, row.to.type, row.to.value);
        }
    }

    associate(fromEntityName: string, fromEntityId: string | Guid, relationshipName: string, toEntityName: string, toEntityId: string | Guid) {

        // perform some validations
        if (!fromEntityName) throw new Error("From entity name not specified");
        fromEntityName = fromEntityName.toLowerCase(); // normalize casing

        if (!toEntityName) throw new Error("To entity name not specified");
        toEntityName = toEntityName.toLowerCase(); // normalize casing

        if (!fromEntityId) throw new Error("fromEntityId not specified");
        if (!toEntityId) throw new Error("toEntityId not specified");

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

    disassociateData(data: DataTable) {
        for (var i = 0; i < data.rows.length; i++) {
            var row = data.rows[i];
            this.disassociate(row.from.type, row.from.value, data.name, row.to.type, row.to.value);
        }
    }

    disassociate(fromEntityName: string, fromEntityId: string | Guid, relationshipName: string, toEntityName: string, toEntityId: string | Guid) {

        // perform some validations
        if (!fromEntityName) throw new Error("From entity name not specified");
        fromEntityName = fromEntityName.toLowerCase(); // normalize casing

        if (!toEntityName) throw new Error("To entity name not specified");
        toEntityName = toEntityName.toLowerCase(); // normalize casing

        if (!fromEntityId) throw new Error("fromEntityId not specified");
        if (!toEntityId) throw new Error("toEntityId not specified");


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

    /** Gets metadata information for a particular CRM Entity.
     * @method CRMClient#getEntityMetadata
     * @param entityName {string} Name of the entity which metadata information you want to get
     * @example <caption>Retrieve metadata information of the account entity</caption>
     * var metadata = crm.getEntityMetadata("account");
     */
    getEntityMetadata(entityName: string): EntityMetadata {
        return MetadataUtil.getEntityMetadata(this,entityName);
    }

    public Execute(request) {
        var response = this._crmBridge.Execute(request, true);
        return response;
    }

    public assign(targetId: Guid | string, targetType: string, assigneeId: Guid | string, assigneeType?: string): void {
        // set the default value
        if (assigneeType === undefined) assigneeType = "systemuser";
        var request = new AssignRequest();
        request.Assignee = new EntityReference(assigneeId.toString(), assigneeType);
        request.Target = new EntityReference(targetId.toString(), targetType);
        var response = this.Execute(request);
    }

    export(entityName: string, fileName: string) {
        ImportExportUtil.export(this,entityName,fileName);
    }

    import(fileName: string) {
        ImportExportUtil.import(this,fileName);
    }

    /** Sets the state and status of a record.  
     * @method CRMClient#setState
     * @param entityName {string} Name of the entity which state or status you want to set
     * @param entityId {Guid|string} GUID of the record which state or status you want to set
     * @param state {number|string} Name or Value of the State you want to set 
     * @param status {number|string} Name or Value of the Status you want to set 
     * @example <caption>Set the state of a task to Completed (1) and the Status to Completed (5)</caption>
     * crm.setState('task','6fefeb79-5447-e511-a5db-0050568a69e2',1,5);
     * @example <caption>Set the state of a task using the text values</caption>
     * crm.setState('task','6fefeb79-5447-e511-a5db-0050568a69e2','Completed','Completed');
     * */
    setState(entityName:string, entityId:Guid|string, state:number|string, status:number|string) {
        StateUtil.setState(this, entityName, entityId, state, status);
    }
}
