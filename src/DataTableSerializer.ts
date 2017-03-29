import { DataTable } from './DataTable';
import { IDataTableSerializer } from './IDataTableSerializer';
import { DataTableJsonSerializer } from './DataTableJsonSerializer';
import { DataTableXmlSerializer } from './DataTableXmlSerializer';
import { DataTableXlsSerializer } from './DataTableXlsSerializer';

import path = require('path');
import fs = require('fs');

/** Default constructor
 * @class DataTableSerializer
 * @classdesc Utility to load and save DataTable objects to different file formats. 
 * More Info: {@link DataTableJsonSerializer} {@link DataTableXlsSerializer} {@link DataTableXmlSerializer}
 */
export class DataTableSerializer {
    /** @lends DataTableSerializer */

    // register serializers here
    static AvailableSerializers: IDataTableSerializer[] =
    [
        new DataTableJsonSerializer(),
        new DataTableXlsSerializer(),
        new DataTableXmlSerializer()
    ];

    private static getSerializer(extension: string): IDataTableSerializer {
        var retVal: IDataTableSerializer = null;
        if (extension !== null && extension.length > 0) {
            // remove first '.' if the extension begins with it
            if (extension.indexOf(".") == 0) extension = extension.substr(1);
            for (var i = 0; i < this.AvailableSerializers.length; i++) {
                var serializer = this.AvailableSerializers[i];
                if (serializer.extension && serializer.extension.toLocaleLowerCase() == extension.toLowerCase()) {
                    retVal = serializer;
                    break;
                }
            }
        }
        return retVal;
    }

    static save(dataTable: DataTable, fileName: string) {

        var ext = path.extname(fileName);
        var serializer = this.getSerializer(ext);

        if (serializer === null) throw new Error(`Format '${ext}' not supported`);
        var data = serializer.serialize(dataTable);
        fs.writeFileSync(fileName, data);
    }

    /** The path is relative to process.cwd() */
    static load(fileName: string): DataTable {
        var dt: DataTable;

        var ext = path.extname(fileName);
        var serializer = this.getSerializer(ext);

        if (serializer === null) throw new Error(`Format '${ext}' not supported`);

        var buffer = fs.readFileSync(fileName);
        dt = serializer.deserialize(buffer);

        return dt;
    }
}