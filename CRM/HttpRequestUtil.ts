/// <reference path="../typings/tsd.d.ts" />

import {SoapXmlParser} from "./SoapXmlParser";

import http = require("http");
import URL = require("url");
import deasync = require("deasync");


export class HttpRequestUtil{

	private static buildPostRequest(url, callback?){
		var urlObj = URL.parse(url);

		var options:http.RequestOptions = {
			method:"Post",
			hostname:urlObj.hostname,
			path:urlObj.path,
			headers:{
				"Accept": "application/xml, text/xml, */*",
				"Content-Type": "text/xml; charset=utf-8",
				"SOAPAction": "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute"
			}
		};

		var req = http.request(options, callback);
		return req;
	}

	public static httpPostRequestSync(url, xml)
	{
		var result=null;
		var response = null, done=false;
		var request = this.buildPostRequest(url, res=>{
			response = res;
			done=true;
		});
		request.write(xml);
		request.end();

		request.on("error", function(e) {
			done=true;
		  console.log("Error on request: %s", url);
			console.log(e);
			throw e;
		});

		// make this request synchronous
		// https://github.com/abbr/deasync
		deasync.loopwhile(()=>!done);

		if(response.statusCode === 200) {
			result = response.responseXML;
		}
		else {
			// TODO: Parse the responseXML before call getSoapError
			throw SoapXmlParser.getSoapError(response.responseXML);
		}
		return result;
	}

	static httpPostRequestaAsync(url, xml){
		return new Promise<any>((resolve, reject)=>{
			var request = this.buildPostRequest(url, res => {
				if(res.status===200){
					resolve(res.responseXML);
				}
				else
				{
					// TODO: Parse the responseXML before call getSoapError
					reject(SoapXmlParser.getSoapError(res.responseXML));
				}
			});

			request.write(xml);
			request.end();
		});
	}
}
