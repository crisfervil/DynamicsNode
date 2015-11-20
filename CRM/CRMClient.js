var DataTable_1 = require("../Data/DataTable");
var SoapXmlParser_1 = require("./SoapXmlParser");
var SoapXmlHelper_1 = require("./SoapXmlHelper");
var HttpRequestUtil_1 = require("./HttpRequestUtil");
var CRMConnection_1 = require("./CRMConnection");
var Guid_1 = require("./Guid");
var path = require("path");
var CRMClient = (function () {
    function CRMClient(pConnection) {
        this.SOAP_ENDPOINT = '/XRMServices/2011/Organization.svc/web';
        if (!pConnection)
            pConnection = "default";
        if (pConnection instanceof CRMConnection_1.CRMConnection) {
            this.connection = pConnection;
        }
        var connectionObject = this.getConnection(pConnection);
        if (connectionObject)
            this.connection = connectionObject;
        if (!connectionObject)
            throw "Connection not found";
    }
    CRMClient.prototype.getConnection = function (name) {
        var returnValue = null;
        var connections;
        try {
            connections = require("../connections.json");
        }
        catch (e) { }
        if (connections)
            returnValue = connections[name];
        return returnValue;
    };
    CRMClient.prototype.getSoapEndpointUrl = function () {
        return path.join(this.connection.url, this.SOAP_ENDPOINT);
    };
    CRMClient.prototype.retrieve = function (entityName, id, columns) {
        var requestXml = SoapXmlHelper_1.SoapXmlHelper.getRetrieveRequest(id.getValue(), entityName, columns);
        var url = this.getSoapEndpointUrl();
        var response = HttpRequestUtil_1.HttpRequestUtil.httpPostRequestSync(url, requestXml);
        return SoapXmlParser_1.SoapXmlParser.getRetrieveResult(response);
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
