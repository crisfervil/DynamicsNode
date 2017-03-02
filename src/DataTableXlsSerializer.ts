import * as XLSX from 'xlsx';
import { IDataTableSerializer } from './IDataTableSerializer'
import { DataTable } from './DataTable';


export class DataTableXlsSerializer implements IDataTableSerializer {
    readonly extension: string;
    constructor() {
        this.extension = "xlsx";
    }

    serialize(dataTable: DataTable): string {
        throw new Error("Not Implemented");
    }

    deserialize(data: Buffer): DataTable {
        var dt = new DataTable();
        var workBook = XLSX.read(data);
        var sheetName = workBook.SheetNames[0];
        var workSheet = workBook.Sheets[sheetName];

        dt.name = sheetName;

        var rangeName: any = workSheet["!ref"];
        var range = XLSX.utils.decode_range(rangeName);
        var from = range.s, to = range.e;

        // Assume the firs row contains column names
        for (var rowIndex = from.r + 1, tableRowIndex = 0; rowIndex <= to.r; rowIndex++ , tableRowIndex++) {
            var row = {};
            for (var colIndex = from.c, tableColIndex = 0; colIndex <= to.c; colIndex++ , tableColIndex++) {

                // Get the column name
                var nameColRange = XLSX.utils.encode_cell({ r: from.r, c: colIndex });
                var colName: any = workSheet[nameColRange];

                var currentRange = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                var colValue = workSheet[currentRange];

                if (colName !== undefined && colName.v !== null && colName.v !== null &&
                    colValue !== undefined && colValue.v !== undefined && colValue.v !== null) {
                    row[colName.v] = colValue.v;
                }
            }
            dt.rows.push(row);
        }

        return dt;
    }
}