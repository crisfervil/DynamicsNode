# Commands
Commands are a way to use Dynamics Node from command line. 


## Export
Exports the data of the specified entity to the specified file using the specified connection. 

In order to use this command, you have to install DynamicsNode in global mode. 

If you have already done so, open your command prompt and type the following command:

```
$ dynamicsnode export account accounts.xml CRMOnline
```

This will export all the existing accounts to the accounts.xml file.

CRMOnline is the connection string or the connection name to use. 

You can specify either an xml or json file.

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

## Import
```
$ dynamicsnode import accounts.xml myCrm
```
** Still to be implemented


# Repl integration
TBC