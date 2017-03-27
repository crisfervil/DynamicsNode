0.0.19
- Improved code coverage
- Added Save to Excel capabilities to the [DataTable](https://dynamicsnode.js.org/DataTable.html) object. See DataTableSerializer object.
- Lots of refactoring to make the code more SOLID
- Added SetBusinessSystemUserRequest message and SecurityHelper class. 
- Corrected bug in DataTableXmlSerializer on the serialization of the attribute names.

0.0.18

- Updated CRM Dlls to the latest SDK version. This is a breaking change in the Connections String, that now have to 
specify the authentication typefor office 365 (AuthType=Office365)
See https://msdn.microsoft.com/en-ie/library/mt608573.aspx
If your code uses several connections in the same script, add the RequireNewInstance=True parameter in the connection string.
See http://crmtipoftheday.com/tag/requirenewinstance/
- Removed the dependency on Newtonsoft.Json.dll 
- Restructured the .net code. Now the code is splitted in different files, and a solution file was added. 
This removes the need of compiling code in each run and improves performance.
- Added loading from Excel capabilities to the [DataTable](https://dynamicsnode.js.org/DataTable.html) object. 
Now, you can load your records from Excel. The Save to Excel is still pending to be added.
- Added the [lookup](https://dynamicsnode.js.org/DataTable.html#lookup__anchor) method in the DataTable object that allows 
to load records resolve the lookup columns before sending the information to CRM.
- Added index.js file to the project, and index.d.ts in the package description to improve the intellisense experience. 
The reference tag is no required any more.
- Added the [removeColumn](https://dynamicsnode.js.org/DataTable.html#removeColumn__anchor), and [renameColumn](https://dynamicsnode.js.org/DataTable.html#renameColumn__anchor) methods in the DataTable object
- Added the [createIfDoesNotExist](https://dynamicsnode.js.org/CRMClient.html#createIfDoesNotExist__anchor) to the [CRMClient](https://dynamicsnode.js.org/CRMClient.html) class.
- Now the MetadataUtil.getAttributeMetadata finds the attribute by the DisplayName of the attribute as well as by the Logical Name.
- Now the RetrieveEntityResponse contains information about the DisplayName of attributes, and about the Optionset and Boolean strings.
- Now in the Create/Update methods of [CRMClient](https://dynamicsnode.js.org/CRMClient.html), you can specify your Optionset and Boolean attribute values using the string value of the optionset.
- Added support for ActivityParty fields
- Removed dependency on typings package
- Added [SetState](https://dynamicsnode.js.org/CRMClient.html#setState__anchor) method
- Updated documentation
