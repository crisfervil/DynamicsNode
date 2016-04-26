import {CRMClient} from "../src/CRMClient";

function showHelp() {
    console.log("USE: dn help");
    console.log("Shows this help");
    console.log("USE: dn export entityName filePath connection");
    console.log("Exports the records of the specified entity to the specified file using the connection with the specified name");
}

function wrongParameters() {
    console.log("Wrong parameters");
    showHelp();
}

function exp(entityName:string,filePath:string,connectionName:string) {
    try{
        var crm = new CRMClient(connectionName);
        crm.export(entityName,filePath);
    }
    catch(ex){
        console.log("Error:");
        if(ex.Message) console.log(ex.Message);
        else console.log(ex);    
    }
    
}

var cmdLineArgs = process.argv;

if (cmdLineArgs.length > 1) {
    var command = cmdLineArgs[2];
    switch (command) {
        case "help":
            showHelp();
            break;
        case "export":
            var entityName=cmdLineArgs[3],filePath=cmdLineArgs[4], connectionName=cmdLineArgs[5];
            if(!entityName||!filePath||!connectionName||cmdLineArgs.length>6) wrongParameters();
            else exp(entityName,filePath,connectionName);
            break;
        default:
            wrongParameters();
    }
}
else {
    wrongParameters();
}