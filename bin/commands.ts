//#!/usr/bin/env node

import {CRMClient} from "../src/CRMClient";
import yargs = require("yargs");

// configure command line options
var argv = yargs
    .usage('Usage: $0 <command> [options]')
    .command("export [options]","exports data from CRM into a file", {
        entity:{ alias:"e", description:"Name of the entity to export", demand:true, requiresArg:true},
        file:{ alias:"f", description:"Name of the file to create with the results. Only .json or .xml formats supported", demand:true, requiresArg:true},
        connection:{ alias:"c", description:"Connection String or name of a connection in the config.json file", demand:true, requiresArg:true}
    }, (args)=>{
        var arrrg:any=args;
        exp(arrrg.entity,arrrg.file,arrrg.connection);
    })
    .help('h')
    .alias('help','h')
    .alias('version','v')
    .version(showVersion())
    .example("export","-e DEV -e account -f accounts.json")
    .argv;

// Show help in case no argument was provided
if(!(argv._&&argv._[0])) yargs.showHelp();


function showVersion(){
    var version = require('../package').version;
    return `DynamicsNode v ${version}`; 
}

function exp(entityName:string,filePath:string,connectionName:string) {
    try{
        console.log("exporting...");
        var crm = new CRMClient(connectionName);
        crm.export(entityName,filePath);
        console.log("done!");
    }
    catch(ex){
        console.log("Error:");
        if(ex.Message) console.log(ex.Message);
        else console.log(ex);    
    }
}