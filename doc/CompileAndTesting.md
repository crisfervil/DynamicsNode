# How to compile the code
## Prerequisites
Node. Install the latest version from: https://nodejs.org/

Git is optional. Can be installed from https://desktop.github.com/

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

After doing that, just run the integration tests script with npm.
```
$  npm run integration-test
```

You should see something like this:
``` console
> dynamicsnode@1.0.0 test
> mocha --recursive

  Integration Tests: Online
    V Creates an account (2041ms)
    V Updates an account (884ms)
    V Updates an account using a criteria (933ms)
    V Knows Who I am (88ms)
    V Performs a simple retrieve (318ms)
    V Performs a retrieve with specific columns (180ms)
    V Performs a retrieve with all columns (177ms)
    V Performs a "retrieve all" of an entity (221ms)
    V Performs a simple retrieve multiple (264ms)


  9 passing (9s)
```