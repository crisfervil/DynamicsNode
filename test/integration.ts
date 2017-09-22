import { CRMClient } from "../src/CRMClient";
import { Fetch } from "../src/Fetch";
import { Guid } from "../src/Guid";
import { DataTable } from "../src/DataTable";
import { DataTableSerializer } from "../src/DataTableSerializer";
import assert = require("assert");
import path = require("path");
import fs = require("fs");
import { WhoAmIRequest, WhoAmIResponse, AddToQueueRequest } from "../src/Messages";
import { SecurityUtil } from '../src/SecurityUtil';
import { EntityReference } from "../src/CRMDataTypes";

// Asserts that there is a value in the specified field in the specified record
function checkFieldValue(dataTable, index, fieldName) {
    assert.ok(dataTable.rows[index][fieldName] !== undefined,
        `record[${index}].'${fieldName}' undefined.\n${JSON.stringify(dataTable.rows[index])}`);
}

before(function () {
    // create temp dir if doesn't exist
    if (!fs.existsSync("test/tmp")) fs.mkdirSync("test/tmp");
});

function tryGetModule(moduleId: string) {
    var result = null;
    try {
        result = require(moduleId);
    } catch (e) { }

    return result;
}

// add tests for connection string in environment variable
if (process.env.INTEGRATION_TESTS_CONN_STRING) {
    addTestsFor("ENV_VARIABLE", process.env.INTEGRATION_TESTS_CONN_STRING);
}

// add tests for connection string in config.json
var config = tryGetModule(path.join(process.cwd(), "config.json"));
if (config && config.connectionStrings) {
    for (var conn in config.connectionStrings) {
        if ((<string>conn).indexOf("IntegrationTest") == 0) // if the connection string name begins with IntegrationTest
        {
            addTestsFor(conn, config.connectionStrings[conn]);
        }
    }
}

function addTestsFor(connectionStringName: string, connectionStringValue: string): void {
    describe(`Integration tests: ${connectionStringName}`, function () {

        this.timeout(15000); // Aplyies to all the suite
        var crm = new CRMClient(connectionStringValue); // Use the same instance of CRM cliente to improve performance

        it('Throws an exception with an invalid connection', function () {
            assert.throws(function () {
                var crm2 = new CRMClient("asdasd");
            });
        });

        it('Creates an account', function () {
            // Use different casing in entity and field names
            var guid = crm.create("acCount", { name: "test account", description: "this is a test", AccountCategoryCode: 1 });
            assert.ok(guid);
            // delete created record
            crm.delete("account", guid);
        });

        it('Updates an account', function () {
            // Use different casing in entity and field names
            var account: any = { name: "test account", description: "this is a test", AccountCategoryCode: 1 };
            var guid = crm.create("acCount", account);
            assert.ok(guid);
            account.accountid = guid;
            account.name = "updated account";
            account.description = "updated description";
            account.AccountCategoryCode = 2;
            crm.update("account", account);

            var updatedAccount = crm.retrieve("account", guid, ["name", "description", "accountcategorycode"]);
            assert.ok(updatedAccount);
            assert.equal(updatedAccount.name, account.name);
            assert.equal(updatedAccount.description, account.description);
            assert.equal(updatedAccount.AccountCategoryCode, account.accountcategorycode);

            // delete created record
            crm.delete("account", guid);
        });

        it('Updates an account using a criteria', function () {
            // Use different casing in entity and field names
            var specificName = "xxxtest accountxxx"
            var account: any = { name: specificName, description: "this is a test", AccountCategoryCode: 1 };
            var guid = crm.create("acCount", account);
            assert.ok(guid);
            var updateValues = { nAMe: "updated account", desCRiption: "updated description", AccountCategoryCode: 2 };
            var affectedRecords = crm.update("account", updateValues, { name: specificName });
            assert.equal(affectedRecords, 1);
            var updatedAccount = crm.retrieve("account", guid, ["name", "description", "accountcategorycode"]);
            assert.ok(updatedAccount);
            assert.equal(updatedAccount.name, updateValues.nAMe);
            assert.equal(updatedAccount.description, updateValues.desCRiption);
            assert.equal(updatedAccount.accountcategorycode, updateValues.AccountCategoryCode);

            // delete created record
            crm.delete("account", guid);
        });

        it('Knows Who I am', function () {
            var who = crm.whoAmI();
            assert.ok(who.UserId);
            assert.ok(who.OrganizationId);
            assert.ok(who.BusinessUnitId);
        });

        it('Performs a simple retrieve', function () {
            var who = crm.whoAmI();
            assert.ok(who);
            var myUser = crm.retrieve("systemuser", who.UserId);
            assert.ok(myUser);
            // test just a few properties
            assert.ok(myUser.domainname);
            assert.ok(myUser.businessunitid);
            assert.ok(myUser.fullname);
            assert.ok(myUser.modifiedon);
            assert.ok(myUser.modifiedby);
            assert.ok(myUser.modifiedby_name);
            assert.ok(myUser.modifiedby_type);
            assert.ok(myUser.invitestatuscode);
            assert.ok(myUser.emailrouteraccessapproval, JSON.stringify(myUser));
        });

        it('Performs a retrieve that doesnt returns any records', function () {

            var record = crm.retrieve("account", { name: "#^*^%^@*" });
            assert.equal(record, null);

        });

        it('Performs a retrieve that doesnt returns any records using a GUID', function () {

            var record = crm.retrieve("account", Guid.create());
            assert.equal(record, null);

        });

        it('Performs a retrieve with specific columns', function () {
            var who = crm.whoAmI();
            assert.ok(who);
            // Use different casing in entity and field names
            var myUser = crm.retrieve("systemuser", who.UserId, ["fullname", "DomainName", "internalemailaddress", "systemuserid"]);
            assert.ok(myUser);
        });

        it('Performs a retrieve with all columns', function () {
            var who = crm.whoAmI();
            assert.ok(who);
            // Use different casing in entity and field names
            var myUser = crm.retrieve("systemuser", who.UserId, true);
            assert.ok(myUser);
        });

        it('Performs a "retrieve all" of an entity', function () {
            var records = crm.retrieveAll("sysTEMuSEr");// the entity name must be lowercased

            assert.ok(records);
            assert.ok(records.rows.length > 0);

            for (var i = 0; i < records.rows.length; i++) {
                checkFieldValue(records, i, "businessunitid");
                checkFieldValue(records, i, "businessunitid_name");
                checkFieldValue(records, i, "businessunitid_type");
                checkFieldValue(records, i, "fullname");
                checkFieldValue(records, i, "domainname");
                checkFieldValue(records, i, "createdon");
            }

        });

        it('Performs a simple retrieve multiple', function () {
            var who = crm.whoAmI();
            assert.ok(who);

            var fetch = new Fetch("SystemUser", "*", { systemuserid: who.UserId });
            var fetchXml = fetch.toString();
            var records = crm.retrieveMultiple(fetchXml);

            assert.ok(records);
            assert.ok(records.rows.length == 1);

            checkFieldValue(records, 0, "domainname");
            checkFieldValue(records, 0, "systemuserid");
            checkFieldValue(records, 0, "businessunitid");
            checkFieldValue(records, 0, "fullname");
        });

        it('Performs a retrieve all', function () {
            // create a lead
            var leadId = crm.create("lead", { description: "test" });

            // retrieve all the leads
            var leads = crm.retrieveAll("lead");
            assert.ok(leads);
            assert.ok(leads.rows.length > 0);

            // delete created record
            crm.delete("lead", leadId);
        });

        it('Creates an incident associated to an account', function () {

            // Gets any account in the system
            var accounts = crm.retrieveMultiple("account", {});
            // If there aren't any accounts in the system, this test will fail
            var accountId = accounts.rows[0].accountid;

            var caseGuid = crm.create("incident", { title: "test", customerid: { id: accountId, type: "account" } });

            assert.ok(caseGuid); // case created ok

            // delete created case
            crm.delete("incident", caseGuid);

        });

        // TODO: Merge this tests with create and update an account
        it('Creates and Updates a Lead', function () {
            // create a lead
            // try different data types
            var lead = {
                description: "test" // memo
                , firstname: "test"// string
                , lastname: 123123 // test number to string conversion
                , estimatedCloseDate: new Date() //datetime
                , donotfax: true // bolean
                , address1_latitude: 89.556 // double
                , numberofemployees: 100 // integer
                //,estimatedamount:150 // money
                //,budgetstatus:1 // picklist
            };
            var leadId = crm.create("lead", lead);
            crm.update("lead", { leadid: leadId, estimatedCloseDate: null });
            crm.delete("lead", leadId);
        });

        it('Associates and Disassociates a lead and an contact', function () {
            // create a lead
            var leadId = crm.create("lead", { description: "test" });

            // create a contact
            var contactId = crm.create("contact", { firstname: "test" });

            // associate them
            crm.associate("contact", contactId, "contactleads_association", "lead", leadId);

            // delete association
            crm.disassociate("contact", contactId, "contactleads_association", "lead", leadId);

            // delete created records
            crm.delete("lead", leadId);
            crm.delete("contact", contactId);
        });

        it('Associates and Disassociates a lead and an contact using a DataTable', function () {
            // create a lead
            var leadId = crm.create("lead", { description: "test" });

            // create a contact
            var contactId = crm.create("contact", { firstname: "test" });

            // Create the datatable
            var dt = new DataTable("contactleads_association");
            var row = { from: { type: "contact", value: contactId }, to: { type: "lead", value: leadId } };
            dt.rows.push(row);

            // associate them
            crm.associateData(dt);

            // delete association
            crm.disassociateData(dt);

            // delete created records
            crm.delete("lead", leadId);
            crm.delete("contact", contactId);
        });

        it('Gets entity metadata', function () {
            var metadata = crm.getEntityMetadata("email");
            // save the data to review it later
            fs.writeFile("test/tmp/email-metadata.json", JSON.stringify(metadata, null, 4));
            assert.ok(metadata, JSON.stringify(metadata));
            assert.equal(metadata.SchemaName, "Email");
            assert.equal(metadata.IsActivity, true);
            assert.equal(metadata.PrimaryIdAttribute, "activityid");
        });

        it('Gets entity metadata', function () {
            var metadata = crm.getEntityMetadata("account");
            // save the data to review it later
            fs.writeFile("test/tmp/account-metadata.json", JSON.stringify(metadata, null, 4));
            assert.ok(metadata, JSON.stringify(metadata));
            assert.equal(metadata.SchemaName, "Account");
            assert.equal(metadata.PrimaryIdAttribute, "accountid");
        });

        it('Executes a WHoAmIRequest', function () {
            var myRequest = new WhoAmIRequest();
            var response: WhoAmIResponse = crm.Execute(myRequest);
            assert.ok(response.UserId);
            assert.ok(response.OrganizationId);
            assert.ok(response.BusinessUnitId);
        });

        it('Creates an Email', function () {
            var contactId = crm.create("contact", { firstname: "test" });
            var who = crm.whoAmI();

            // Create an e-mail message.
            var email = {
                To: [{ id: contactId, type: "contact" }],
                From: [{ id: who.UserId, type: "systemuser" }],
                Subject: "Test Email",
                Description: "Test Email",
                DirectionCode: true
            };
            var emailId = crm.create("email", email);
            assert.ok(emailId !== null);

            // delete created records
            crm.delete("email", emailId);
            crm.delete("contact", contactId);
        });

        it('Assigns a record', function () {

            var account: any = { name: "test account", description: "this is a test", AccountCategoryCode: 1 };
            var accountId = crm.create("acCount", account);
            assert.ok(accountId);

            // find a user that's not me
            var myUser = crm.whoAmI();
            // TODO: add current user operator
            var usrs = crm.retrieveMultiple("systemuser", { systemuserid: { $neq: myUser.UserId } }, ["fullname"]);
            var userId = usrs.rows[0].systemuserid;

            // assign the record
            crm.assign(accountId, "account", userId);

            // Check if the record was assigned to the user
            account = crm.retrieve("account", accountId, ["ownerid"]);
            assert.equal(account.ownerid, userId);

            // delete the created acount
            crm.delete("account", accountId);
        });

        // TODO: Find a team with permissions on accounts
        it.skip('Assigns a record to a team', function () {

            var account: any = { name: "test account", description: "this is a test", AccountCategoryCode: 1 };
            var accountId = crm.create("acCount", account);
            assert.ok(accountId);


            // find the top business unit
            var topBu = crm.retrieve("businessunit", { parentbusinessunitid: null }, ["name", "businessunitid"]);
            console.log(topBu);

            // find a team from the top
            var teams = crm.retrieveMultiple("team", { businessunitid: topBu.businessunitid }, ["name"]);
            var teamId = teams.rows[0].teamid;

            // assign the record
            crm.assign(accountId, "account", teamId, "team");

            // Check if the record was assigned to the user
            account = crm.retrieve("account", accountId, ["ownerid"]);
            assert.equal(account.ownerid, teamId);

            // delete the created acount
            crm.delete("account", accountId);
        });


        it('Exports accounts in xml format', function () {
            var fileName = `test/tmp/accounts-${connectionStringName}.xml`;
            crm.export("account", fileName);
            // Try to load exported data
            var data = DataTableSerializer.load(fileName);
            assert.ok(data, JSON.stringify(data));
            assert.ok(data.rows.length > 0, JSON.stringify(data));
        });

        it.skip("Export and import users to a File", function () {

            var fileName = `test/tmp/users-${connectionStringName}.xml`;

            var users = crm.retrieveAll("systemuser");
            DataTableSerializer.save(users,fileName);
            var users2 = DataTableSerializer.load(fileName);
            assert.deepEqual(users, users2);

        });

        it("Looks up the parent account of a contact using the contact phone number", function () {

            // create an account with a specific phone number
            var phoneNumber = "555454-" + Math.round(Math.random() * 10000);
            var accountId = crm.create("account", { name: "test account", telephone1: phoneNumber });

            // create a contact using a data table and associate to the create account using the phone number
            var dtContacts = new DataTable("contact");
            dtContacts.rows.push({ firstName: "testContact", telephone1: phoneNumber, parentcustomerid: null });

            // resolve the parentaccountid field
            dtContacts.lookup("parentcustomerid", row => { return { id: crm.retrieve("account", { telephone1: row.telephone1 }).accountid, type: "account" } });

            crm.create(dtContacts);

            // delete created records
            crm.delete("contact", dtContacts.rows[0].contactid);
            crm.delete("account", accountId);
        });

        it ('Deactivates a Task', function(){

            var stateCode = 1; // Completed
            var statusCode = 5; // Completed

            var taskId = crm.create('task',{subject:'test'});
            crm.setState('task',taskId,stateCode,statusCode);

            // Check the status of the task
            var task = crm.retrieve('task',taskId,['statecode','statuscode'])

            assert.equal(task.statuscode,statusCode);
            assert.equal(task.statecode,stateCode);

            // delete created task
            crm.delete('task',taskId);
        });

        it ('Changes the status of a Phone Call to Completed using Status Labels', function(){

            var stateCode = 'Completed';
            var statusCode = 'Received';

            var callId = crm.create('phonecall',{subject:'test'});
            crm.setState('phonecall',callId,stateCode,statusCode);

            // Check the status of the task
            var phoneCall = crm.retrieve('phonecall',callId,['statecode','statuscode'])

            assert.equal(phoneCall.statuscode,4);
            assert.equal(phoneCall.statecode,1);

            // delete created task
            crm.delete('phonecall',callId);
        });

        it('changes a user businessunit using a SetBusinessSystemUserRequest message',function(){

            var who = crm.whoAmI();
            // Just set the same bu to the current user to make sure the call is performed correctly
            SecurityUtil.SetUserBusinessUnit(crm,who.UserId,who.BusinessUnitId);
        });

        it('changes a user businessunit using a systemuser update',function(){
            var who = crm.whoAmI();
            crm.update('systemuser',{systemuserid:who.UserId, businessunitid:who.BusinessUnitId});
		});

		it("creates a task and adds it to a queue", () => {

            var callId:string = crm.create("phonecall",{subject:"test"});

			// get the current user's default queue
			var whoAmI:WhoAmIResponse = crm.whoAmI();
			var currentUser:any = crm.retrieve("systemuser",whoAmI.UserId,["queueid"]);
			var defaultQueueId:string = currentUser.queueid;

			var request:AddToQueueRequest = new AddToQueueRequest();
			request.DestinationQueueId = defaultQueueId;
			request.Target = new EntityReference(callId, "phonecall");
			crm.Execute(request);

		});
    });
}
