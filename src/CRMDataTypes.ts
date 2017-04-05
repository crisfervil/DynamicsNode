
export class EntityReference {
    public __typeName="Microsoft.Xrm.Sdk,Microsoft.Xrm.Sdk.EntityReference";
    constructor(public Id:string,public LogicalName:string){
    }
}

export class OptionSetValue {
    public __typeName="Microsoft.Xrm.Sdk,Microsoft.Xrm.Sdk.OptionSetValue";
    constructor(public Value:number){
    }
}

export class Entity {
    public __typeName="Microsoft.Xrm.Sdk,Microsoft.Xrm.Sdk.Entity";

    public Id:string;
    public LogicalName:string;
    public Attributes:any;
}

export class EntityMetadata{
    public PrimaryIdAttribute:string;
    public SchemaName:string;
    public Attributes:AttributeMetadata[];
    public IsActivity:boolean;
}

export class LocalizedLabel{
    Label:string;
}

export class Label {
    UserLocalizedLabel:LocalizedLabel;
}

export class OptionMetadata{
    public Label:Label;
    public Value:number;
}

export class OptionsetMetadata{
    public Options:OptionMetadata[];
}

export class BooleanOptionsetMetadata{
    public TrueOption:OptionMetadata;
    public FalseOption:OptionMetadata;
}

export class AttributeMetadata{
    public LogicalName:string;
    public AttributeType:string;
    public Targets:string[];
    public DisplayName:Label;
    public OptionSet:OptionsetMetadata|BooleanOptionsetMetadata;
}

export class RolePrivilege {
    // https://msdn.microsoft.com/en-us/library/microsoft.crm.sdk.messages.roleprivilege.aspx
    public __typeName="Microsoft.Crm.Sdk.Proxy,Microsoft.Crm.Sdk.Messages.RolePrivilege";
    public Name:string;
    public PrivilegeId:string;
    public Depth:PrivilegeDepth;
}

export enum AttributeTypeCode{
    BigInt=0x12,
    Boolean=0,	
    CalendarRules=0x10,	
    Customer=1,	
    DateTime=2,	
    Decimal=3,	
    Double=4,	
    EntityName=20,	
    Integer=5,	
    Lookup=6,	
    ManagedProperty=0x13,	
    Memo=7,
    Money=8,
    Owner=9,	
    PartyList=10,	
    Picklist=11,	
    State=12,	
    Status=13,	
    String=14,	
    Uniqueidentifier=15,
    Virtual=0x11	
}

export enum EntityFilters
{
    Entity = 1,
    Default = 1,
    Attributes = 2,
    Privileges = 4,
    Relationships = 8,
    All = 15
}

export enum PrivilegeDepth{
    // https://msdn.microsoft.com/en-us/library/microsoft.crm.sdk.messages.privilegedepth.aspx
    Basic=0,
    Deep=2,
    Global=3,
    Local=1
}

export class Decimal {
    public __typeName="System.Decimal";
    constructor(public Value:number){
    }
}

export class Money {
    public __typeName="Microsoft.Xrm.Sdk,Microsoft.Xrm.Sdk.Money";
    constructor(public Value:Decimal){
    }
}

