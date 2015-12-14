# How to compile the code
First, get the latest version of the code from github, either using the clone button from the web, or using the command line.
```
$ git clone https://github.com/crisfervil/DynamicsIntegration.git
```
Then, cd into the cloned directory
```
$ cd DynamicsIntegration
```
Install dependencies using npm
```
$ npm install
```
Install Typescript typings
```
$ tsd install
```
Finally, compile typescript code
```
$ tsc -p .
```

# How to run tests
Requires mocha to run the tests (https://mochajs.org/)
```
$  npm test
```
## Integration Tests
In order to run the integration tests, first clone and compile the code as described above.

Then, you need create a config.json file in the root folder of DynamicsIntegration folder.

The config.json must have the following format:
```json
{
	"connectionStrings":
	{
		"IntegrationTests2015":"Url=https://contoso.crm4.dynamics.com; Username=admin@contoso.onmicrosoft.com; Password=YourPassword;"
	}
}

```
You need to create a connection string named "IntegrationTestsXXXX" where XXXX is the CRM version you want to test against. Can be 2011, 2013 or 2015.

That XXXX indicates what version of the CRM dlls do you want to use in order to run the tests.

You can add up to three different integration tests, oner per supported version, 2011, 2013 or 2015.

After doing that, just re run the tests with mocha.
```
$  npm test
```

You should see something like this:
``` console
> dynamicsintegration@1.0.0 test
> mocha --recursive



  CRMClient
    V Throws an exception with an invalid connection (249ms)

  Fetch
    V Serializes a simple Fetch
    V Serializes a simple Fetch with conditions
    V Serializes a complex Fetch

  Guid
    V Creates an instance of non empty Guid
    V Creates an instance of empty Guid
    V Creates an instance from a string
    V Validates Guid format on creation
    V Generates new Guids
    V Compares two different Guids
    V Compares two equal Guids
    V Compares a Guid value with a string

  Integration Tests: 2011
    V Creates an account (1653ms)
    V Updates an account (805ms)
    V Updates an account using a criteria (931ms)
    V Knows Who I am (43ms)
    V Performs a simple retrieve (114ms)
    V Performs a retrieve with specific columns (76ms)
    V Performs a retrieve with all columns (78ms)
    V Performs a "retrieve all" of an entity (97ms)
    V Performs a simple retrieve multiple (103ms)

  Integration Tests: 2015
    V Creates an account (2041ms)
    V Updates an account (884ms)
    V Updates an account using a criteria (933ms)
    V Knows Who I am (88ms)
    V Performs a simple retrieve (318ms)
    V Performs a retrieve with specific columns (180ms)
    V Performs a retrieve with all columns (177ms)
    V Performs a "retrieve all" of an entity (221ms)
    V Performs a simple retrieve multiple (264ms)


  30 passing (9s)
```
