# Commands
Commands are a way to use Dynamics Node from command line. 

In order to use those commands, you have to install DynamicsNode in global mode. 

To install DynamicsNode in global mode use the following command.
```
$  npm install -g dynamicsnode
```


## Export
Exports the data of the specified entity to the specified file using the specified connection. 

Usage:

```
$ dynamicsnode export -e [entityName] -f [file] -c [connection]
```

This will export all the existing accounts to the accounts.xml file.

You can specify either an xml or a json file.

CRMOnline is the connection string or the connection name to use. 

In order to reference connections using a name, create a file config.json at the root of your scripts folder.

The config.json must have the following format:
```json
{
	"connectionStrings":
	{
		"default":"Url=https://contoso.crm4.dynamics.com",
		"CRMOnline":"Url=https://contoso.crm4.dynamics.com; Username=admin@contoso.onmicrosoft.com; Password=YourPassword;"
	}
}
```
Each name inside connectionStrings is a name you can use in your export command.

## Import
```
$ dynamicsnode import -f [fileName] -c [connection]
```

This command imports the contents of the specified file into CRM.

As in the export command, you can specify any connection name in the config.json file.

The specified file can be an .xml or .json file. 

Each one has a very specific format. 

The easiest way to review this format is generate it through the export command.

# Repl integration
```
$ dynamicsnode repl
```
This command initiates Dynamics Node in repl mode. 

This means, that you can interact with CRM using the existing API and evaluating the code as you type it.
