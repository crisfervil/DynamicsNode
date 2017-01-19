0.0.18

- Updated CRM Dlls to the latest SDK version. This is a breaking change in the Connections String, that now have to 
specify the authentication type, either AuthType=AD; or AuthType=Office365; for office 365. 
See https://msdn.microsoft.com/en-ie/library/mt608573.aspx
- Reduced the amount of code in the .net side, which will make easier to add new functionality to the framework 
and will increase testability. Removed the dependency on Newtonsoft.Json.dll 
- Added loading from Excel capabilities in the [DataTable](https://dynamicsnode.js.org/DataTable.html) object. 
Now, you can load your records from Excel. The Save to Excel is still pending to be added.
- Added the [lookup](https://dynamicsnode.js.org/DataTable.html#lookup__anchor) method in the DataTable object that allows 
to load records resolve the lookup columns before sending the information to CRM.
- Added index.js file to the project, and index.d.ts in the package description to improve the intellisense experience. 
The reference tag is no required any more.
- Added the removeColumn, and renameColumn methods in the DataTable object
- Added the createIfDoesNotExist in the CRMClient object
- Now the CRMClient.getAttributeMetadata finds the attribute by the DisplayName of the attribute as well as by the Logical Name.
- Now the RetrieveEntityResponse contains information about the DisplayName of attributes, and about the Optionset and Boolean strings.
- Now in the Create/Update methods of CRMClient, you can specify your Optionset and Boolean attribute values using the string value of the optionset.
- Added support for ActivityParty fields
- Removed dependency on typings