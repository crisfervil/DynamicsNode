/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/custom.d.ts" />
var DataTable_1 = require("../Data/DataTable");
var Guid_1 = require("./Guid");
var path = require("path");
var edge = require("edge");
var CRMClient = (function () {
    function CRMClient(connectionString) {
        this.connectionString = connectionString;
        var config = this.tryGetModule("../config.json");
        if (config && config.connectionStrings && config.connectionStrings[connectionString]) {
            this.connectionString = config.connectionStrings[connectionString];
        }
        if (!this.connectionString)
            throw "Connection String not specified";
        var source = path.join(__dirname, "CRMBridge.cs");
        var ref1 = path.join(__dirname, "bin/Microsoft.Crm.Sdk.Proxy.dll");
        var ref2 = path.join(__dirname, "bin/Microsoft.Xrm.Client.dll");
        var ref3 = path.join(__dirname, "bin/Microsoft.Xrm.Sdk.dll");
        var ref4 = path.join("System.Runtime.Serialization.dll");
        var createBridge = edge.func({
            source: source,
            references: [ref1, ref2, ref3, ref4]
        });
        this.crmBridge = createBridge(this.connectionString, true);
    }
    CRMClient.prototype.tryGetModule = function (moduleId) {
        var result = null;
        try {
            result = require(moduleId);
        }
        catch (e) { }
        return result;
    };
    CRMClient.prototype.WhoAmI = function () {
        return this.crmBridge.WhoAmI(null, true);
    };
    CRMClient.prototype.retrieve = function (entityName, id, columns) {
        var result;
        var retrieveResult = this.crmBridge.Retrieve({ entityName: entityName, id: id.getValue(), columns: columns }, true);
        if (retrieveResult) {
            result = {};
            for (var i = 0; i < retrieveResult.length; i += 2) {
                result[retrieveResult[i]] = retrieveResult[i + 1];
            }
        }
        return result;
    };
    CRMClient.prototype.fetchAll = function (entityName) {
        return new DataTable_1.DataTable();
    };
    CRMClient.prototype.create = function (entityName, attributes) {
        return new Guid_1.Guid();
    };
    CRMClient.prototype.update = function (entityName, criteria, values) {
    };
    return CRMClient;
})();
exports.CRMClient = CRMClient;
