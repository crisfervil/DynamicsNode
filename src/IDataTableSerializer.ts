import {DataTable} from './DataTable';


export interface IDataTableSerializer{
    readonly extension:string;
    serialize(dataTable:DataTable):string;
    deserialize(buffer:Buffer):DataTable;
}