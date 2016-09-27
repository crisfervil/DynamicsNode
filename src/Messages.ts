import {EntityReference} from "./CRMClient";

export class WhoAmIRequest{
    public __typeName="Microsoft.Crm.Sdk.dll,Microsoft.Crm.Sdk.Messages.WhoAmIRequest";
}

export class WhoAmIResponse{
    public BusinessUnitId:string;
    public OrganizationId:string;
    public UserId:string;
}

export class AssignRequest{
    public __typeName="Microsoft.Crm.Sdk.dll,Microsoft.Crm.Sdk.Messages.AssignRequest";
    public Assignee:EntityReference;
    public Target:EntityReference;    
}

export class AssignResponse{

}