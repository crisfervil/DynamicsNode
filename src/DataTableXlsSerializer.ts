import * as XLSX from 'xlsx';
import { IDataTableSerializer } from './IDataTableSerializer'
import { DataTable } from './DataTable';

class WorkBook implements XLSX.IWorkBook{
    Sheets: { [sheet: string]: XLSX.IWorkSheet };
    SheetNames: string[];
    Props: XLSX.IProperties;   
}

class WorkSheet implements XLSX.IWorkSheet{
    [cell: string]: XLSX.IWorkSheetCell;
}

/** Default constructor
 * @class DataTableXlsSerializer
 * @classdesc Saves and loads a {@link DataTable} object to and from a MS Excel file (xlsx). 
 * When reading from an Excel file, the data is taken from the first sheet in the workbook. 
 * It is assumed that the first row contains the column names. 
 * When serializing, the name of the sheet containing the data will be the name in the DataTable object.
 */
export class DataTableXlsSerializer implements IDataTableSerializer {
    readonly extension: string;
    constructor() {
        this.extension = "xlsx";
    }

    /** Serializes the specified {@link DataTable} object into a Buffer data.
     * @method DataTableXlsSerializer#serialize
    */
    serialize(dataTable: DataTable): Buffer {
       
        var wb = new WorkBook();
        var ws = new WorkSheet();
        wb.Sheets={};

        var sheetName = dataTable.name || "DynamicsNode";

        wb.Sheets[sheetName]=ws;
        wb.SheetNames=[sheetName];

        // Holds the list of columns in the dataTable
        var columnNames:string[]=[];

        for (var rowIndex = 0; rowIndex < dataTable.rows.length; rowIndex++) {
            var row = dataTable.rows[rowIndex];
            
            for (var colName in row) {
                if (row.hasOwnProperty(colName)) {
                    var colValue = row[colName];
                    if(colValue!==null){
                        var colIndex = this.getColIndex(colName,columnNames);
                        var cellRef = XLSX.utils.encode_cell({c:colIndex,r:rowIndex+1});
                        var cellType=this.getCellType(colValue);

                        // convert to milliseconds
                        var isDate=colValue instanceof Date;
                        if(isDate) colValue=(<Date>colValue).valueOf();

                        var cell:XLSX.IWorkSheetCell = {v:colValue,t:cellType};
                        
                        if(isDate) cell.z = (<any>XLSX).SSF._table[14];

                        ws[cellRef] = cell;
                    }
                }
            }
        }

        // add the column names
        for (var colIndex = 0; colIndex < columnNames.length; colIndex++) {
            var columnName = columnNames[colIndex];
            var cellRef = XLSX.utils.encode_cell({c:colIndex,r:0});
            var cell:XLSX.IWorkSheetCell = {v:columnName,t:'s'};
            ws[cellRef] = cell;
        }

        var range:XLSX.IRange;
        var encodedRange:string;
        var rangeColumnsTo=columnNames.length>0?columnNames.length-1:0;
        var rangeRowsTo=dataTable.rows.length;
        
        if(rangeColumnsTo==0 && rangeRowsTo==0){
            encodedRange="A1:A1";
        }
        else {
            range={e:{c:0,r:0},s:{c:rangeColumnsTo,r:rangeRowsTo}};
            encodedRange=XLSX.utils.encode_range(range.e,range.s);
        }
        
        ws['!ref']=<any>encodedRange;

        var serialized= XLSX.write(wb,{bookType:'xlsx', type: 'buffer'});
        return serialized;
    }

    private getCellType(value: any): string {
        var type:string='s';
        if (typeof value === 'number'){
            type = 'n';
        } 
        else if (typeof value === 'boolean') {
            type = 'b';
        } 
        else if (value instanceof Date) {
            type = 'n'; 
        }
        return type;
    }

    /** Gets the index of the column. If it doesn't exist, it adds it to the columns array  */
    private getColIndex(colName:string,columns:string[]):number{
        var index=columns.indexOf(colName);
        if(index==-1){
            columns.push(colName);
            index=columns.length-1;
        }
        return index;
    }

    /** Deserializes the specified buffer data into a {@link DataTable} object
     * @method DataTableXlsSerializer#deserialize
    */
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
        // TODO: Make this optional
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