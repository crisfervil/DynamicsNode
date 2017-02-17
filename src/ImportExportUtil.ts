import { CRMClient } from "./CRMClient";
import { DataTable } from "./DataTable";

var debug = require("debug")("dynamicsnode");

export class ImportExportUtil {

    /** Exports all the existing records of a given entity to the specified file */
    static export(client:CRMClient, entityName: string, fileName: string) {

        debug(`Exporting ${entityName} to ${fileName}...`);

        // perform some validations
        if (!entityName) throw new Error("Entity name not specified");
        entityName = entityName.toLowerCase(); // normalize casing

        debug("Getting metadata...");
        var metadata = client.getEntityMetadata(entityName);
        debug("Getting data...");
        var data = client.retrieveMultiple(entityName, {});
        var rowsCount = data ? data.rows ? data.rows.length : 0 : 0;
        debug(`Retrieved ${rowsCount} records`);
        debug("Saving...");
        data.save(fileName);
        debug("done!");
    }

    /** Loads the specified file in CRM. If the record exists, then it updates. Otherwhise, it creates it. */
    static import(client:CRMClient, fileName: string) {

        debug(`Importing ${fileName}...`);

        debug("Loading data table...");
        var dt = DataTable.load(fileName);
        debug(`${dt.rows.length} records found`);

        debug(`Getting metadata for entity ${dt.name}...`);
        var metadata = client.getEntityMetadata(dt.name);

        var idField = client.getIdField(dt.name);

        debug("Importing...");

        for (let i = 0; i < dt.rows.length; i++) {
            debug(`record ${i + 1} of ${dt.rows.length}...`);
            client.createOrUpdate(dt.name, dt.rows[i], [idField]);
        }

        debug("done!");
    }
}