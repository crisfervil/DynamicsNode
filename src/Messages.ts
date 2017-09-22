import {EntityMetadata,EntityReference,EntityFilters,OptionSetValue,RolePrivilege} from "./CRMDataTypes";

export class WhoAmIRequest {
    public __typeName="Microsoft.Crm.Sdk.Proxy,Microsoft.Crm.Sdk.Messages.WhoAmIRequest";
}

export class WhoAmIResponse {
    public BusinessUnitId:string;
    public OrganizationId:string;
    public UserId:string;
}

export class AssignRequest {
    public __typeName="Microsoft.Crm.Sdk.Proxy,Microsoft.Crm.Sdk.Messages.AssignRequest";
    public Assignee:EntityReference;
    public Target:EntityReference;
}

export class AssignResponse {

}

export class RetrieveEntityRequest{
    public __typeName="Microsoft.Xrm.Sdk,Microsoft.Xrm.Sdk.Messages.RetrieveEntityRequest";
    constructor(public LogicalName:string, public EntityFilters:EntityFilters){
    }
}

export class RetrieveEntityResponse {
    public EntityMetadata:EntityMetadata;
}

export class SetStateRequest{
    public __typeName="Microsoft.Crm.Sdk.Proxy,Microsoft.Crm.Sdk.Messages.SetStateRequest";
    public EntityMoniker:EntityReference;
    public State:OptionSetValue;
    public Status:OptionSetValue;
}

export class SetBusinessSystemUserRequest {
    public __typeName="Microsoft.Crm.Sdk.Proxy,Microsoft.Crm.Sdk.Messages.SetBusinessSystemUserRequest";
    public BusinessId:string;
    public UserId:string;
    public ReassignPrincipal:EntityReference;
}

export class AddPrivilegesRoleRequest {
    // https://msdn.microsoft.com/en-us/library/microsoft.crm.sdk.messages.addprivilegesrolerequest.aspx
    public __typeName="Microsoft.Crm.Sdk.Proxy,Microsoft.Crm.Sdk.Messages.AddPrivilegesRoleRequest";
    public RoleId:string;
    public Privileges:RolePrivilege[];
}

export class AddToQueueRequest {
    public __typeName="Microsoft.Crm.Sdk.Proxy,Microsoft.Crm.Sdk.Messages.AddToQueueRequest";
    public DestinationQueueId:string;
    public Target:EntityReference;
}
