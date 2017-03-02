import { CRMClient } from "./CRMClient";
import { DataTable } from "./DataTable";
import { DataTableSerializer } from "./DataTableSerializer";

var info = require("debug")("dynamicsnode:info");

export class ImportExportUtil {

    /** Exports all the existing records of a given entity to the specified file */
    static export(client:CRMClient, entityName: string, fileName: string) {

        info(`Exporting ${entityName} to ${fileName}...`);

        // perform some validations
        if (!entityName) throw new Error("Entity name not specified");
        entityName = entityName.toLowerCase(); // normalize casing

        info("Getting metadata...");
        var metadata = client.getEntityMetadata(entityName);
        info("Getting data...");
        var data = client.retrieveMultiple(entityName, {});
        var rowsCount = data ? data.rows ? data.rows.length : 0 : 0;
        info(`Retrieved ${rowsCount} records`);
        info("Saving...");
        DataTableSerializer.save(data,fileName);
    }

    /** Loads the specified file in CRM. If the record exists, then it updates. Otherwhise, it creates it. */
    static import(client:CRMClient, fileName: string) {

        info(`Importing ${fileName}...`);

        info("Loading data table...");
        var dt = DataTableSerializer.load(fileName);
        info(`${dt.rows.length} records found`);

        info(`Getting metadata for entity ${dt.name}...`);
        var metadata = client.getEntityMetadata(dt.name);

        var idField = client.getIdField(dt.name);

        info("Importing...");

        for (let i = 0; i < dt.rows.length; i++) {
            info(`record ${i + 1} of ${dt.rows.length}...`);
            client.createOrUpdate(dt.name, dt.rows[i], [idField]);
        }
    }
}