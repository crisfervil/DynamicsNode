import {DataTable} from './DataTable';


export interface IDataTableSerializer{
    readonly extension:string;
    serialize(dataTable:DataTable):Buffer;
    deserialize(buffer:Buffer):DataTable;
}