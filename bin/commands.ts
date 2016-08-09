//#!/usr/bin/env node

import {CRMClient} from "../src/CRMClient";
import yargs = require("yargs");

console.log("initializing...");
// configure command line options
var argv = yargs
    .usage('Usage: $0 <command> [options]')
    .option("connection",{
        alias:"c",
        describe:"name of the connection in the connections string file"
    })
    .option("entity",{
        alias:"e",
        describe:"name of the entity to be imported/exported"
    })
    .command("export <connection> <entity> <file>","exports data from CRM into a file")
    .demand("command")
    .argv;


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

/*
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
}*/