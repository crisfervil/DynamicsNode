/// <reference path="../typings/tsd.d.ts" />
var SoapXmlParser_1 = require("./SoapXmlParser");
var http = require("http");
var URL = require("url");
var deasync = require("deasync");
var HttpRequestUtil = (function () {
    function HttpRequestUtil() {
    }
    HttpRequestUtil.buildPostRequest = function (url, callback) {
        var urlObj = URL.parse(url);
        var options = {
            method: "Post",
            hostname: urlObj.hostname,
            path: urlObj.path,
            headers: {
                "Accept": "application/xml, text/xml, */*",
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute"
            }
        };
        var req = http.request(options, callback);
        return req;
    };
    HttpRequestUtil.httpPostRequestSync = function (url, xml) {
        var result = null;
        var response = null, done = false;
        var request = this.buildPostRequest(url, function (res) {
            response = res;
            done = true;
        });
        request.write(xml);
        request.end();
        request.on("error", function (e) {
            done = true;
            console.log("Error on request: %s", url);
            console.log(e);
            throw e;
        });
        deasync.loopwhile(function () { return !done; });
        if (response.statusCode === 200) {
            result = response.responseXML;
        }
        else {
            throw SoapXmlParser_1.SoapXmlParser.getSoapError(response.responseXML);
        }
        return result;
    };
    HttpRequestUtil.httpPostRequestaAsync = function (url, xml) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var request = _this.buildPostRequest(url, function (res) {
                if (res.status === 200) {
                    resolve(res.responseXML);
                }
                else {
                    reject(SoapXmlParser_1.SoapXmlParser.getSoapError(res.responseXML));
                }
            });
            request.write(xml);
            request.end();
        });
    };
    return HttpRequestUtil;
})();
exports.HttpRequestUtil = HttpRequestUtil;
