import {DataTable} from "../Data/DataTable";
import {SoapXmlParser} from "./SoapXmlParser";
import {SoapXmlHelper} from "./SoapXmlHelper";
import {HttpRequestUtil} from "./HttpRequestUtil";
import {CRMConnection} from "./CRMConnection";
import {Guid} from "./Guid";

import path = require("path");

export class CRMClient
{
  private SOAP_ENDPOINT: string = '/XRMServices/2011/Organization.svc/web';
  public connection:CRMConnection;

  constructor(pConnection?:CRMConnection|string)
  {
    if(!pConnection) pConnection="default";
    if(pConnection instanceof CRMConnection){
      this.connection=pConnection;
    }
    var connectionObject = this.getConnection(<string>pConnection);
    if(connectionObject) this.connection=connectionObject;
    if(!connectionObject) throw "Connection not found";
  }

  private getConnection(name:string){
    var returnValue = null
    var connections;
    try{
      connections = require("../connections.json");
    }
    catch(e) { }

    if(connections) returnValue = connections[name];

    return returnValue;
  }

  private getSoapEndpointUrl():string
  {
    return path.join(this.connection.url,this.SOAP_ENDPOINT);
  }

  retrieve(entityName:string, id:Guid, columns?:string[]):any
  {
    var requestXml = SoapXmlHelper.getRetrieveRequest(id.getValue(), entityName, columns);
    var url = this.getSoapEndpointUrl();
    var response = HttpRequestUtil.httpPostRequestSync(url,requestXml);
    return SoapXmlParser.getRetrieveResult(response);
  }

  fetchAll(entityName:string):DataTable
  {
    return new DataTable();
  }

  create(entityName:string,attributes:any):Guid
  {
    return new Guid();
  }

  //update(entityName:string,values:any):void;
  update(entityName:string,criteria:any, values?:any):void
  {

  }

}
