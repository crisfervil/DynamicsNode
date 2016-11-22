
export class EntityReference {
    public __typeName="Microsoft.Xrm.Sdk,Microsoft.Xrm.Sdk.EntityReference";
    constructor(public Id:string,public LogicalName:string){
    }
}

export class Entity {
    public __typeName="Microsoft.Xrm.Sdk,Microsoft.Xrm.Sdk.Entity";

    public Id:string;
    public LogicalName:string;
    public Attributes:any;    
}