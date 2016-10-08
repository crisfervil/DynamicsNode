# How to compile the code
## Prerequisites
In order to build the TypeScript compiler, ensure that you have [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org) installed.

## Steps
First, get the latest version of the code from Github, either using the clone button from the web, or using the command line.
```
$ git clone https://github.com/crisfervil/DynamicsNode.git
```
Then, cd into the cloned directory
```
$ cd DynamicsNode
```
Install dependencies using npm
```
$ npm install
```
Run the build script
```
$ npm run build
```

# How to run tests
Use the default npm command for testing.
```
$  npm test
```
# Debug
In order to see debug information in console, type following command:
```
set DEBUG=dynamicsnode 
```
You should see debug information like this:
```
  dynamicsnode Exporting account to accounts.xml +0ms
  dynamicsnode Getting metadata... +0ms
  dynamicsnode Getting data... +1s
  dynamicsnode Saving... +531ms
  dynamicsnode done! +32ms
  
```

## Integration Tests
In order to run the integration tests, first clone and compile the code as described above.

Then, you need create a config.json file in the root of DynamicsNode folder.

The config.json must have the following format:
```json
{
	"connectionStrings":
	{
		"IntegrationTestsOnline":"Url=https://contoso.crm4.dynamics.com; Username=admin@contoso.onmicrosoft.com; Password=YourPassword;"
	}
}

```
You need to create a connection string named "IntegrationTestsXXXX" where XXXX is whatever name you want to use to indentify your connection.

After doing that, just re-run tests script with npm.
```
$  npm test
```

You should see something like this:
``` console
c:\GitHub\DynamicsNode>npm test

> dynamicsnode@0.0.4 test c:\GitHub\DynamicsNode
> mocha --recursive



  CRMClient
    √ Throws an exception with an invalid connection (169ms)
    √ Tells who I am (148ms)
    √ Creates a record (153ms)
    √ Deletes a record (147ms)
    √ Updates a record (137ms)
    √ Associates two records (169ms)
    √ Disassociates two records (163ms)
    √ Gets entity metadata (153ms)

  DataTable
    √ Initializes from an existing Array
    √ Loads and read JSON data
    √ Loads and reads XML data

  Fetch
    √ Serializes a simple Fetch
    √ Serializes a simple Fetch with conditions
    √ Serializes a complex Fetch

  Guid
    √ Creates an instance of non empty Guid
    √ Creates an instance of empty Guid
    √ Creates an instance from a string
    √ Validates Guid format on creation
    √ Generates new Guids
    √ Compares two different Guids
    √ Compares two equal Guids
    √ Compares a Guid value with a string

  Integration tests: IntegrationTestsOnline
    √ Throws an exception with an invalid connection (169ms)
    √ Creates an account (937ms)
    √ Updates an account (588ms)
    √ Updates an account using a criteria (1740ms)
    √ Knows Who I am (68ms)
    √ Performs a simple retrieve (139ms)
    √ Performs a retrieve that doesnt returns any records (134ms)
    √ Performs a retrieve that doesnt returns any records using a GUID (100ms)
    √ Performs a retrieve with specific columns (139ms)
    √ Performs a retrieve with all columns (131ms)
    √ Performs a "retrieve all" of an entity (134ms)
    √ Performs a simple retrieve multiple (185ms)
    √ Performs a retrieve all (154ms)
    √ Associates and Disassociates a lead and an contact (434ms)
    √ Associates and Disassociates a lead and an contact using a DataTable (440ms)
    √ Gets entity metadata
    - Export and import users to a File


  38 passing (7s)
  1 pending

```