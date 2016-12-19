
declare module 'dynamicsnode' {

    export class EntityReference {
        Id: string;
        LogicalName: string;
        __typeName: string;
        constructor(Id: string, LogicalName: string);
    }

    export class WhoAmIRequest {
        __typeName: string;
    }
    export class WhoAmIResponse {
        BusinessUnitId: string;
        OrganizationId: string;
        UserId: string;
    }
    export class AssignRequest {
        __typeName: string;
        Assignee: EntityReference;
        Target: EntityReference;
    }
    export class AssignResponse {
    }

    export class Guid {
        private static EMPTY;
        private static validator;
        private value;
        constructor(guid?: string);
        private static gen(count);
        equals(other: Guid | string): boolean;
        isEmpty(): boolean;
        toString(): string;
        toJSON(): string;
        getValue(): string;
        static isGuid(value: string | Guid): boolean;
        static create(): Guid;
        static raw(): string;
        static empty(): Guid;
    }

    export class DataTable {
        rows: Array<any>;
        constructor(rows?: Array<any>);
        lookup(columnName: string, updater: (row: any) => any): void;
        save(fileName: string): void;
        static load(fileName: string): DataTable;
        private static parseNumbers(str);
        private static parseBooleans(str);
        private static parseDates(str);
        private static parseValue(str);
        private static JSONDataReviver(key, str);
        private static parseXml(xmlContent);
        private serializeXml(data);
        private serializeValue(value);
    }

    export class Fetch {
        entityName: string;
        filter: Filter;
        attributes: string[];
        constructor(entityName?: string, attr?: string | boolean | string[], filterConditions?: any);
        toString(): string;
        private serializeAttributes(value, writer);
        setFilter(filterConditions: any): void;
        setAttributes(attributes: boolean | string | string[]): void;
        private serializeValue(value);
        private serializeConditions(filter, writer);
        private operatorNames;
        private operatorJsonNames;
        private convert(conditionExpression);
    }

    export enum FilterTypes {
        And = 0,
        Or = 1,
    }

    export class Filter {
        conditions: Array<Condition>;
        filterType: FilterTypes;
        constructor(conditions?: Array<Condition>, filterType?: FilterTypes);
    }

    export enum Operators {
        Equal = 0,
        NotEqual = 1,
        GreaterThan = 2,
        GreaterEqual = 3,
        LessEqual = 4,
        LessThan = 5,
        Like = 6,
        NotLike = 7,
        In = 8,
        NotIn = 9,
        Between = 10,
        NotBetween = 11,
        Null = 12,
        NotNull = 13,
    }

    export class Condition {
        attribute: string;
        operator: Operators;
        values: Array<any>;
        constructor(attribute?: string, operator?: Operators, values?: Array<any>);
    }

    /**
     * @class Allows to access to CRM functions.
     * @param {string} connectionString Optional. A valid connection string or connection string name
     */
    export class CRMClient {
        constructor(connectionString?: string, version?: string);
        whoAmI(): WhoAmIResponse;
        testConnection(): void;
        retrieve(entityName: string, idOrConditions: string | Guid | Object, pColumns?: string | string[] | boolean): any;
        retrieveMultiple(fetchXml: string): DataTable;
        retrieveMultiple(entityName: string, conditions?: any, attributes?: boolean | string | string[]): DataTable;
        retrieveAll(entityName: string): DataTable;
        create(entityName: string, attributes: any): string;
        delete(entityName: string, idsOrConditions: any): number;
        update(entityName: string, attributes: any, conditions?: any): number;
        getIdField(entityName: string): string;
        createOrUpdate(entityName: string, attributes: any, matchFields: string[]): void;
        associateData(data: DataTable): void;
        associate(fromEntityName: string, fromEntityId: string | Guid, relationshipName: string, toEntityName: string, toEntityId: string | Guid): void;
        disassociateData(data: DataTable): void;
        disassociate(fromEntityName: string, fromEntityId: string | Guid, relationshipName: string, toEntityName: string, toEntityId: string | Guid): void;
        getEntityMetadata(entityName: string): any;
        execute(request: any): any;
        assign(targetId: Guid | string, targetType: string, assigneeId: Guid | string, assigneeType?: string): void;
        export(entityName: string, fileName: string): void;
        import(fileName: string): void;
    }
}
