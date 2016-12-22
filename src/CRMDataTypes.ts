
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