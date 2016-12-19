0.0.18

- Updated CRM Dlls to the latest SDK version. This is a breaking change in the Connections String, that now have to specify the authentication type, either AuthType=AD; or AuthType=Office365; for office 365. See https://msdn.microsoft.com/en-ie/library/mt608573.aspx
- Reduced the amount of code in the .net side, which will make easier to add new functionality to the framework and will increase testability. 