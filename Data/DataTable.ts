export class DataTable
{
  lookup(columnName:string, updater: (row:any)=>any):void
  {
  }

  save(fileName:string){

  }

  static load(fileName:string):DataTable
  {
    return new DataTable();
  }
}
