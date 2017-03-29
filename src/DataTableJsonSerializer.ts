import {IDataTableSerializer} from './IDataTableSerializer'
import {DataTable} from './DataTable';


/** Default constructor
 * @class DataTableJsonSerializer
 * @classdesc Saves and loads a {@link DataTable} object to and from an json file. 
 */
export class DataTableJsonSerializer implements IDataTableSerializer {
    readonly extension:string;

    constructor(){
        this.extension="json";
    }

    /** Serializes the specified {@link DataTable} object into a Buffer data.
     * @method DataTableJsonSerializer#serialize
    */
    serialize(dataTable:DataTable):Buffer{
        return new Buffer(JSON.stringify(dataTable, null, 4),'utf8');
    }

    /** Deserializes the specified buffer data into a {@link DataTable} object
     * @method DataTableJsonSerializer#deserialize
    */
    deserialize(data:Buffer):DataTable{
        return JSON.parse(data.toString('utf8'), DataTableJsonSerializer.JSONDataReviver);
    }

    private static JSONDataReviver(key, str:string) {
        var result: any = str;
        if (typeof str === 'string' || str instanceof String) {
            var parsedValue = DataTableJsonSerializer.parseDates(str);
            if (parsedValue !== null) {
                result = parsedValue;
            }
        }
        return result;
    };

    private static parseDates(str:string): any {
        var result: any = null;
        var dateParts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.*(\d*)Z$/.exec(str);
        if (dateParts !== null) {
            result = new Date(Date.UTC(+dateParts[1], +dateParts[2] - 1, +dateParts[3], +dateParts[4], +dateParts[5], +dateParts[6], +dateParts[7]));
        }
        return result;
    }
}